"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { buildTechnicalEnglishFeedback, createTechnicalEnglishAttempt, evaluateTechnicalEnglishText } from "./core";
import { hydrateWithWatchdog, hydrationErrorMessage, validateHydratedTechnicalEnglishState, type TechnicalEnglishHydrationStatus } from "./startup";
import type { AudioEvidenceReference, ResponseModality, SpeakingMode, TechnicalEnglishAttempt, TechnicalEnglishEventType } from "./types";

type TechnicalEnglishState = {
  attempts: Record<string, TechnicalEnglishAttempt>;
  currentAttemptId: string | null;
  prepare: () => void;
  setMode: (mode: SpeakingMode) => void;
  setModality: (modality: ResponseModality) => void;
  setAudioReference: (reference: AudioEvidenceReference | null) => void;
  setTextResponse: (value: string) => void;
  setManualTranscript: (value: string) => void;
  addEvent: (type: TechnicalEnglishEventType, value?: number) => void;
  evaluate: () => void;
  complete: (comfort: number, explainAgain: "YES" | "MAYBE" | "NO", hardestWord: string) => void;
  restart: () => void;
};

function updateCurrent(state: TechnicalEnglishState, transform: (attempt: TechnicalEnglishAttempt) => TechnicalEnglishAttempt) {
  if (!state.currentAttemptId) return state;
  const attempt = state.attempts[state.currentAttemptId];
  if (!attempt) return state;
  return { attempts: { ...state.attempts, [attempt.id]: transform(attempt) } };
}

function localEvent(type: TechnicalEnglishEventType, value?: number) {
  return { type, at: Date.now(), value };
}

export const useTechnicalEnglishStore = create<TechnicalEnglishState>()(
  persist(
    (set) => ({
      attempts: {},
      currentAttemptId: null,
      prepare: () => set((state) => {
        if (state.currentAttemptId && state.attempts[state.currentAttemptId]) return state;
        const attempt = createTechnicalEnglishAttempt();
        return { attempts: { ...state.attempts, [attempt.id]: attempt }, currentAttemptId: attempt.id };
      }),
      setMode: (mode) => set((state) => updateCurrent(state, (attempt) => ({ ...attempt, mode, status: attempt.status === "READY" ? "IN_PROGRESS" : attempt.status }))),
      setModality: (modality) => set((state) => updateCurrent(state, (attempt) => ({ ...attempt, modality, status: attempt.status === "READY" ? "IN_PROGRESS" : attempt.status, evaluation: null, feedback: null }))),
      setAudioReference: (audioReference) => set((state) => updateCurrent(state, (attempt) => ({ ...attempt, audioReference, status: audioReference ? "RESPONSE_SAVED" : "IN_PROGRESS", evaluation: null, feedback: null }))),
      setTextResponse: (textResponse) => set((state) => updateCurrent(state, (attempt) => ({ ...attempt, textResponse, status: "IN_PROGRESS", evaluation: null, feedback: null }))),
      setManualTranscript: (manualTranscript) => set((state) => updateCurrent(state, (attempt) => ({ ...attempt, manualTranscript, transcriptionStatus: manualTranscript.trim() ? "MANUAL_AVAILABLE" : "UNAVAILABLE", events: manualTranscript.trim() && !attempt.manualTranscript.trim() ? [...attempt.events, localEvent("TRANSCRIPTION_CREATED")] : attempt.events, evaluation: null, feedback: null }))),
      addEvent: (type, value) => set((state) => updateCurrent(state, (attempt) => ({ ...attempt, events: [...attempt.events, localEvent(type, value)] }))),
      evaluate: () => set((state) => updateCurrent(state, (attempt) => {
        const source = attempt.modality === "TEXT" ? attempt.textResponse : attempt.manualTranscript;
        const evaluation = evaluateTechnicalEnglishText(source);
        return { ...attempt, status: "EVALUATED", evaluation, feedback: buildTechnicalEnglishFeedback(evaluation, attempt.mode), events: [...attempt.events, localEvent("FEEDBACK_VIEWED")] };
      })),
      complete: (comfort, explainAgain, hardestWord) => set((state) => updateCurrent(state, (attempt) => {
        if (attempt.status !== "EVALUATED") return attempt;
        const at = Date.now();
        return { ...attempt, status: "COMPLETED", comfort, explainAgain, hardestWord, completedAt: at, events: [...attempt.events, localEvent("SELF_EVALUATION_SUBMITTED", comfort), { type: "SPEAKING_ATTEMPT_COMPLETED", at }] };
      })),
      restart: () => set((state) => {
        const attempt = createTechnicalEnglishAttempt();
        return { attempts: { ...state.attempts, [attempt.id]: attempt }, currentAttemptId: attempt.id };
      }),
    }),
    {
      name: "engineer-learning-os:technical-english:v1",
      skipHydration: true,
      partialize: ({ attempts, currentAttemptId }) => ({ attempts, currentAttemptId }),
    },
  ),
);

type TechnicalEnglishStartupState = {
  status: TechnicalEnglishHydrationStatus;
  error: string | null;
  durationMs: number | null;
  markLoading: () => void;
  markReady: (durationMs: number) => void;
  markFailed: (message: string, durationMs: number) => void;
};

export const useTechnicalEnglishStartupStore = create<TechnicalEnglishStartupState>((set) => ({
  status: "NOT_STARTED",
  error: null,
  durationMs: null,
  markLoading: () => set({ status: "LOADING", error: null }),
  markReady: (durationMs) => set({ status: "READY", error: null, durationMs }),
  markFailed: (error, durationMs) => set({ status: "RECOVERABLE_ERROR", error, durationMs }),
}));

const HYDRATION_WATCHDOG_MS = 3_000;
let activeHydration: Promise<void> | null = null;

export function initializeTechnicalEnglishStore(timeoutMs = HYDRATION_WATCHDOG_MS) {
  const startup = useTechnicalEnglishStartupStore.getState();
  if (startup.status === "READY") {
    useTechnicalEnglishStore.getState().prepare();
    return Promise.resolve();
  }
  if (activeHydration) return activeHydration;

  const startedAt = Date.now();
  startup.markLoading();
  activeHydration = hydrateWithWatchdog(
    () => useTechnicalEnglishStore.persist.rehydrate(),
    timeoutMs,
  ).then(() => {
    const hydrated = useTechnicalEnglishStore.getState();
    validateHydratedTechnicalEnglishState(hydrated.attempts, hydrated.currentAttemptId);
    hydrated.prepare();
    useTechnicalEnglishStartupStore.getState().markReady(Date.now() - startedAt);
  }).catch((error) => {
    useTechnicalEnglishStartupStore.getState().markFailed(
      hydrationErrorMessage(error),
      Date.now() - startedAt,
    );
  }).finally(() => {
    activeHydration = null;
  });
  return activeHydration;
}
