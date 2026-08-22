"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  continueDeepMasteryAttempt,
  createDeepMasteryAttempt,
  pauseDeepMasteryAttempt,
  resumeDeepMasteryAttempt,
  retryDeepMasteryStep,
  revealDeepMasteryHint,
  startDeepMasteryAttempt,
  submitDeepMasteryStep,
} from "./core";
import type { DeepMasteryAttempt, DeepMasteryDefinition, DeepMasteryStartupStatus } from "./types";
import { bootstrapDeepMastery } from "./startup";

type DeepMasteryState = {
  startupStatus: DeepMasteryStartupStatus;
  startupError: string | null;
  attempts: Record<string, DeepMasteryAttempt>;
  history: Record<string, DeepMasteryAttempt[]>;
  drafts: Record<string, string>;
  confidenceDrafts: Record<string, number>;
  prepare: (definition: DeepMasteryDefinition) => void;
  start: (definition: DeepMasteryDefinition) => void;
  setDraft: (definitionId: string, value: string) => void;
  setConfidence: (definitionId: string, value: number) => void;
  submit: (definition: DeepMasteryDefinition, responseOverride?: string, confidenceOverride?: number) => void;
  retry: (definition: DeepMasteryDefinition) => void;
  showHint: (definition: DeepMasteryDefinition) => void;
  continueStep: (definition: DeepMasteryDefinition) => void;
  pause: (definition: DeepMasteryDefinition) => void;
  resume: (definition: DeepMasteryDefinition) => void;
  restart: (definition: DeepMasteryDefinition) => void;
  recoverMalformed: (definition: DeepMasteryDefinition) => void;
  beginLoading: () => void;
  markReady: (definition: DeepMasteryDefinition) => void;
  markRecoverableError: (message: string) => void;
};

function current(state: DeepMasteryState, definition: DeepMasteryDefinition) {
  const attempt = state.attempts[definition.id];
  return attempt?.definitionVersion === definition.version ? attempt : createDeepMasteryAttempt(definition);
}

export const useDeepMasteryStore = create<DeepMasteryState>()(
  persist(
    (set, get) => ({
      startupStatus: "LOADING",
      startupError: null,
      attempts: {},
      history: {},
      drafts: {},
      confidenceDrafts: {},
      prepare: (definition) => set((state) => state.attempts[definition.id]?.definitionVersion === definition.version ? state : ({ attempts: { ...state.attempts, [definition.id]: createDeepMasteryAttempt(definition) } })),
      start: (definition) => set((state) => ({ attempts: { ...state.attempts, [definition.id]: startDeepMasteryAttempt(current(state, definition)) } })),
      setDraft: (definitionId, value) => set((state) => ({ drafts: { ...state.drafts, [definitionId]: value } })),
      setConfidence: (definitionId, value) => set((state) => ({ confidenceDrafts: { ...state.confidenceDrafts, [definitionId]: value } })),
      submit: (definition, responseOverride, confidenceOverride) => {
        const state = get();
        const response = responseOverride ?? state.drafts[definition.id] ?? "";
        const confidence = confidenceOverride ?? state.confidenceDrafts[definition.id] ?? 0;
        const attempt = submitDeepMasteryStep(current(state, definition), definition, response, confidence);
        set({ attempts: { ...state.attempts, [definition.id]: attempt } });
      },
      retry: (definition) => set((state) => ({
        attempts: { ...state.attempts, [definition.id]: retryDeepMasteryStep(current(state, definition), definition) },
        drafts: { ...state.drafts, [definition.id]: "" },
        confidenceDrafts: { ...state.confidenceDrafts, [definition.id]: 0 },
      })),
      showHint: (definition) => set((state) => ({ attempts: { ...state.attempts, [definition.id]: revealDeepMasteryHint(current(state, definition), definition) } })),
      continueStep: (definition) => set((state) => ({
        attempts: { ...state.attempts, [definition.id]: continueDeepMasteryAttempt(current(state, definition), definition) },
        drafts: { ...state.drafts, [definition.id]: "" },
        confidenceDrafts: { ...state.confidenceDrafts, [definition.id]: 0 },
      })),
      pause: (definition) => set((state) => ({ attempts: { ...state.attempts, [definition.id]: pauseDeepMasteryAttempt(current(state, definition)) } })),
      resume: (definition) => set((state) => ({ attempts: { ...state.attempts, [definition.id]: resumeDeepMasteryAttempt(current(state, definition)) } })),
      restart: (definition) => set((state) => {
        const prior = state.attempts[definition.id];
        const history = prior?.startedAt ? { ...state.history, [definition.id]: [...(state.history[definition.id] ?? []), prior] } : state.history;
        return { attempts: { ...state.attempts, [definition.id]: createDeepMasteryAttempt(definition) }, history, drafts: { ...state.drafts, [definition.id]: "" }, confidenceDrafts: { ...state.confidenceDrafts, [definition.id]: 0 } };
      }),
      recoverMalformed: (definition) => set((state) => ({ attempts: { ...state.attempts, [definition.id]: createDeepMasteryAttempt(definition) }, drafts: { ...state.drafts, [definition.id]: "" }, confidenceDrafts: { ...state.confidenceDrafts, [definition.id]: 0 } })),
      beginLoading: () => set({ startupStatus: "LOADING", startupError: null }),
      markReady: (definition) => set((state) => ({ startupStatus: state.attempts[definition.id]?.status === "COMPLETED" ? "COMPLETED" : "READY", startupError: null })),
      markRecoverableError: (message) => set({ startupStatus: "RECOVERABLE_ERROR", startupError: message }),
    }),
    {
      name: "engineer-learning-os:deep-mastery:v1",
      skipHydration: true,
      partialize: ({ attempts, history }) => ({ attempts, history }),
      merge: (persisted, currentState) => {
        const saved = persisted as Partial<Pick<DeepMasteryState, "attempts" | "history">> | undefined;
        return {
          ...currentState,
          attempts: saved?.attempts && typeof saved.attempts === "object" ? saved.attempts : {},
          history: saved?.history && typeof saved.history === "object" ? saved.history : {},
        };
      },
    },
  ),
);

export async function hydrateDeepMasteryStore(definition: DeepMasteryDefinition, timeoutMs = 1500) {
  useDeepMasteryStore.getState().beginLoading();
  return bootstrapDeepMastery({
    definition,
    hydrate: () => useDeepMasteryStore.persist.rehydrate(),
    readAttempt: () => useDeepMasteryStore.getState().attempts[definition.id],
    prepareFresh: () => useDeepMasteryStore.getState().prepare(definition),
    recoverMalformed: () => useDeepMasteryStore.getState().recoverMalformed(definition),
    markReady: () => useDeepMasteryStore.getState().markReady(definition),
    markRecoverableError: (message) => useDeepMasteryStore.getState().markRecoverableError(message),
    timeoutMs,
  });
}
