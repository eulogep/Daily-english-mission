"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { closeAcademicRemediation, continueAcademicQuiz, createAcademicQuizAttempt, pauseAcademicQuiz, resumeAcademicQuiz, retryAcademicQuestion, revealAcademicHint, selectAcademicRemediation, startAcademicQuiz, submitAcademicAnswer } from "./core";
import type { AcademicQuizAttempt, AcademicQuizDefinition, RemediationMethodId } from "./types";

type State = {
  hydrated: boolean;
  attempts: Record<string, AcademicQuizAttempt>;
  history: Record<string, AcademicQuizAttempt[]>;
  drafts: Record<string, string>;
  markHydrated: () => void;
  prepare: (definition: AcademicQuizDefinition) => void;
  start: (definition: AcademicQuizDefinition) => void;
  setDraft: (definitionId: string, value: string) => void;
  submit: (definition: AcademicQuizDefinition) => void;
  retry: (definition: AcademicQuizDefinition) => void;
  showHint: (definition: AcademicQuizDefinition) => void;
  selectRemediation: (definition: AcademicQuizDefinition, methodId: RemediationMethodId) => void;
  closeRemediation: (definition: AcademicQuizDefinition) => void;
  continueQuiz: (definition: AcademicQuizDefinition) => void;
  pause: (definition: AcademicQuizDefinition) => void;
  resume: (definition: AcademicQuizDefinition) => void;
  restart: (definition: AcademicQuizDefinition) => void;
};

const current = (state: State, definition: AcademicQuizDefinition) => state.attempts[definition.id] ?? createAcademicQuizAttempt(definition);

export const useAcademicWorkspaceStore = create<State>()(
  persist(
    (set) => ({
      hydrated: false,
      attempts: {},
      history: {},
      drafts: {},
      markHydrated: () => set({ hydrated: true }),
      prepare: (definition) => set((state) => state.attempts[definition.id] ? state : { attempts: { ...state.attempts, [definition.id]: createAcademicQuizAttempt(definition) } }),
      start: (definition) => set((state) => ({ attempts: { ...state.attempts, [definition.id]: startAcademicQuiz(current(state, definition)) } })),
      setDraft: (definitionId, value) => set((state) => ({ drafts: { ...state.drafts, [definitionId]: value } })),
      submit: (definition) => set((state) => ({ attempts: { ...state.attempts, [definition.id]: submitAcademicAnswer(current(state, definition), definition, state.drafts[definition.id] ?? "") } })),
      retry: (definition) => set((state) => ({ attempts: { ...state.attempts, [definition.id]: retryAcademicQuestion(current(state, definition), definition) }, drafts: { ...state.drafts, [definition.id]: "" } })),
      showHint: (definition) => set((state) => ({ attempts: { ...state.attempts, [definition.id]: revealAcademicHint(current(state, definition), definition) } })),
      selectRemediation: (definition, methodId) => set((state) => ({ attempts: { ...state.attempts, [definition.id]: selectAcademicRemediation(current(state, definition), definition, methodId) } })),
      closeRemediation: (definition) => set((state) => ({ attempts: { ...state.attempts, [definition.id]: closeAcademicRemediation(current(state, definition), definition) }, drafts: { ...state.drafts, [definition.id]: "" } })),
      continueQuiz: (definition) => set((state) => ({ attempts: { ...state.attempts, [definition.id]: continueAcademicQuiz(current(state, definition), definition) }, drafts: { ...state.drafts, [definition.id]: "" } })),
      pause: (definition) => set((state) => ({ attempts: { ...state.attempts, [definition.id]: pauseAcademicQuiz(current(state, definition)) } })),
      resume: (definition) => set((state) => ({ attempts: { ...state.attempts, [definition.id]: resumeAcademicQuiz(current(state, definition)) } })),
      restart: (definition) => set((state) => {
        const prior = state.attempts[definition.id];
        return {
          attempts: { ...state.attempts, [definition.id]: createAcademicQuizAttempt(definition) },
          history: prior?.startedAt ? { ...state.history, [definition.id]: [...(state.history[definition.id] ?? []), prior] } : state.history,
          drafts: { ...state.drafts, [definition.id]: "" },
        };
      }),
    }),
    { name: "engineer-learning-os:academic-workspace:v1", skipHydration: true, partialize: ({ attempts, history }) => ({ attempts, history }) },
  ),
);
