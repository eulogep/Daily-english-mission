"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  continueProfessionalScenarioAttempt,
  createProfessionalWritingRetestAttempt,
  createProfessionalScenarioAttempt,
  organizeProfessionalWritingNotes,
  pauseProfessionalScenarioAttempt,
  resumeProfessionalScenarioAttempt,
  retryProfessionalScenarioTask,
  revealProfessionalScenarioHint,
  setProfessionalScenarioConfidence,
  setProfessionalScenarioAssistance,
  setProfessionalWritingNote,
  startProfessionalScenarioAttempt,
  submitProfessionalScenarioTask,
} from "./core";
import { bootstrapProfessionalScenario } from "./startup";
import type { ProfessionalAssistanceUsed, ProfessionalScenarioAttempt, ProfessionalScenarioDefinition, ProfessionalScenarioStartupStatus, ProfessionalWritingSection } from "./types";

type ProfessionalScenarioState = {
  startupStatus: ProfessionalScenarioStartupStatus;
  startupError: string | null;
  attempts: Record<string, ProfessionalScenarioAttempt>;
  history: Record<string, ProfessionalScenarioAttempt[]>;
  drafts: Record<string, string>;
  prepare: (definition: ProfessionalScenarioDefinition) => void;
  start: (definition: ProfessionalScenarioDefinition) => void;
  setDraft: (definitionId: string, value: string) => void;
  setAssistance: (definition: ProfessionalScenarioDefinition, taskId: string, value: ProfessionalAssistanceUsed) => void;
  setWritingNote: (definition: ProfessionalScenarioDefinition, taskId: string, section: ProfessionalWritingSection, value: string) => void;
  organizeWriting: (definition: ProfessionalScenarioDefinition, taskId: string) => void;
  setConfidence: (definition: ProfessionalScenarioDefinition, value: number) => void;
  submit: (definition: ProfessionalScenarioDefinition) => void;
  retry: (definition: ProfessionalScenarioDefinition) => void;
  showHint: (definition: ProfessionalScenarioDefinition) => void;
  continueTask: (definition: ProfessionalScenarioDefinition) => void;
  pause: (definition: ProfessionalScenarioDefinition) => void;
  resume: (definition: ProfessionalScenarioDefinition) => void;
  restart: (definition: ProfessionalScenarioDefinition) => void;
  restartWriting: (definition: ProfessionalScenarioDefinition) => void;
  recoverMalformed: (definition: ProfessionalScenarioDefinition) => void;
  beginLoading: () => void;
  markReady: (definition: ProfessionalScenarioDefinition) => void;
  markRecoverableError: (message: string) => void;
};

function normalizeAttempt(attempt: ProfessionalScenarioAttempt): ProfessionalScenarioAttempt {
  return { ...attempt, assistanceUsed: attempt.assistanceUsed ?? {}, writingNotes: attempt.writingNotes ?? {} };
}

function current(state: ProfessionalScenarioState, definition: ProfessionalScenarioDefinition) {
  const attempt = state.attempts[definition.id];
  return attempt?.definitionVersion === definition.version ? normalizeAttempt(attempt) : createProfessionalScenarioAttempt(definition);
}

export const useProfessionalScenarioStore = create<ProfessionalScenarioState>()(
  persist(
    (set, get) => ({
      startupStatus: "LOADING",
      startupError: null,
      attempts: {},
      history: {},
      drafts: {},
      prepare: (definition) => set((state) => state.attempts[definition.id]?.definitionVersion === definition.version ? state : { attempts: { ...state.attempts, [definition.id]: createProfessionalScenarioAttempt(definition) } }),
      start: (definition) => set((state) => ({ attempts: { ...state.attempts, [definition.id]: startProfessionalScenarioAttempt(current(state, definition)) } })),
      setDraft: (definitionId, value) => set((state) => ({ drafts: { ...state.drafts, [definitionId]: value } })),
      setAssistance: (definition, taskId, value) => set((state) => ({ attempts: { ...state.attempts, [definition.id]: setProfessionalScenarioAssistance(current(state, definition), taskId, value) } })),
      setWritingNote: (definition, taskId, section, value) => set((state) => ({ attempts: { ...state.attempts, [definition.id]: setProfessionalWritingNote(current(state, definition), taskId, section, value) } })),
      organizeWriting: (definition, taskId) => {
        const state = get();
        const attempt = setProfessionalScenarioAssistance(current(state, definition), taskId, "IN_APP_SCAFFOLD");
        const notes = attempt.writingNotes[taskId] ?? { observation: "", impact: "", uncertainty: "", nextAction: "" };
        set({ attempts: { ...state.attempts, [definition.id]: attempt }, drafts: { ...state.drafts, [definition.id]: organizeProfessionalWritingNotes(notes) } });
      },
      setConfidence: (definition, value) => set((state) => ({ attempts: { ...state.attempts, [definition.id]: setProfessionalScenarioConfidence(current(state, definition), value) } })),
      submit: (definition) => {
        const state = get();
        const attempt = submitProfessionalScenarioTask(current(state, definition), definition, state.drafts[definition.id] ?? "");
        set({ attempts: { ...state.attempts, [definition.id]: attempt } });
      },
      retry: (definition) => set((state) => ({
        attempts: { ...state.attempts, [definition.id]: retryProfessionalScenarioTask(current(state, definition), definition) },
        drafts: { ...state.drafts, [definition.id]: "" },
      })),
      showHint: (definition) => set((state) => ({ attempts: { ...state.attempts, [definition.id]: revealProfessionalScenarioHint(current(state, definition), definition) } })),
      continueTask: (definition) => set((state) => ({
        attempts: { ...state.attempts, [definition.id]: continueProfessionalScenarioAttempt(current(state, definition), definition) },
        drafts: { ...state.drafts, [definition.id]: "" },
      })),
      pause: (definition) => set((state) => ({ attempts: { ...state.attempts, [definition.id]: pauseProfessionalScenarioAttempt(current(state, definition)) } })),
      resume: (definition) => set((state) => ({ attempts: { ...state.attempts, [definition.id]: resumeProfessionalScenarioAttempt(current(state, definition)) } })),
      restart: (definition) => set((state) => {
        const prior = state.attempts[definition.id];
        const history = prior?.startedAt ? { ...state.history, [definition.id]: [...(state.history[definition.id] ?? []), prior] } : state.history;
        return { attempts: { ...state.attempts, [definition.id]: createProfessionalScenarioAttempt(definition) }, history, drafts: { ...state.drafts, [definition.id]: "" } };
      }),
      restartWriting: (definition) => set((state) => {
        const prior = current(state, definition);
        const history = prior.startedAt ? { ...state.history, [definition.id]: [...(state.history[definition.id] ?? []), prior] } : state.history;
        return { attempts: { ...state.attempts, [definition.id]: createProfessionalWritingRetestAttempt(prior, definition) }, history, drafts: { ...state.drafts, [definition.id]: "" } };
      }),
      recoverMalformed: (definition) => set((state) => ({ attempts: { ...state.attempts, [definition.id]: createProfessionalScenarioAttempt(definition) }, drafts: { ...state.drafts, [definition.id]: "" } })),
      beginLoading: () => set({ startupStatus: "LOADING", startupError: null }),
      markReady: (definition) => set((state) => ({ startupStatus: state.attempts[definition.id]?.status === "COMPLETED" ? "COMPLETED" : "READY", startupError: null })),
      markRecoverableError: (message) => set({ startupStatus: "RECOVERABLE_ERROR", startupError: message }),
    }),
    {
      name: "engineer-learning-os:professional-scenarios:v1",
      skipHydration: true,
      partialize: ({ attempts, history }) => ({ attempts, history }),
      merge: (persisted, currentState) => {
        const saved = persisted as Partial<Pick<ProfessionalScenarioState, "attempts" | "history">> | undefined;
        return {
          ...currentState,
          attempts: saved?.attempts && typeof saved.attempts === "object"
            ? Object.fromEntries(Object.entries(saved.attempts).map(([id, attempt]) => [id, normalizeAttempt(attempt)]))
            : {},
          history: saved?.history && typeof saved.history === "object" ? saved.history : {},
        };
      },
    },
  ),
);

export async function hydrateProfessionalScenarioStore(definition: ProfessionalScenarioDefinition, timeoutMs = 1500) {
  useProfessionalScenarioStore.getState().beginLoading();
  return bootstrapProfessionalScenario({
    definition,
    hydrate: () => useProfessionalScenarioStore.persist.rehydrate(),
    readAttempt: () => useProfessionalScenarioStore.getState().attempts[definition.id],
    prepareFresh: () => useProfessionalScenarioStore.getState().prepare(definition),
    recoverMalformed: () => useProfessionalScenarioStore.getState().recoverMalformed(definition),
    markReady: () => useProfessionalScenarioStore.getState().markReady(definition),
    markRecoverableError: (message) => useProfessionalScenarioStore.getState().markRecoverableError(message),
    timeoutMs,
  });
}
