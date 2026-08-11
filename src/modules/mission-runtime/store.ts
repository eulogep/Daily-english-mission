"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { runtimeDemoMission } from "./demo-mission";
import { evaluateMissionStep } from "./evaluate";
import type { MissionAttempt, MissionEvent, MissionFeedback } from "./types";

type RuntimeState = {
  hydrated: boolean;
  attempt: MissionAttempt;
  draft: string;
  markHydrated: () => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  setDraft: (value: string) => void;
  submit: () => void;
  retry: () => void;
  showHint: () => void;
  continueStep: () => void;
  reset: () => void;
};

const nowEvent = (type: MissionEvent["type"], stepId?: string, value?: number): MissionEvent => ({ type, at: Date.now(), stepId, value });

function createAttempt(): MissionAttempt {
  return {
    id: "runtime-demo-attempt",
    createdAt: Date.now(),
    missionId: runtimeDemoMission.id,
    missionVersion: runtimeDemoMission.version,
    status: "READY",
    currentStepIndex: 0,
    completedStepIds: [],
    responses: {},
    attempts: {},
    hintsUsed: {},
    feedback: {},
    startedAt: null,
    activeSince: null,
    elapsedMs: 0,
    completedAt: null,
    events: [],
  };
}

function elapsed(attempt: MissionAttempt) {
  return attempt.elapsedMs + (attempt.activeSince ? Date.now() - attempt.activeSince : 0);
}

export const useMissionRuntimeStore = create<RuntimeState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      attempt: createAttempt(),
      draft: "",
      markHydrated: () => set({ hydrated: true }),
      start: () => set(({ attempt }) => attempt.status !== "READY" ? { attempt } : ({
        attempt: { ...attempt, status: "IN_PROGRESS", startedAt: Date.now(), activeSince: Date.now(), events: [...attempt.events, nowEvent("TIME_TO_START_LEARNING", undefined, Date.now() - attempt.createdAt), nowEvent("MISSION_START")] },
      })),
      pause: () => set(({ attempt }) => attempt.status !== "IN_PROGRESS" ? { attempt } : ({
        attempt: { ...attempt, status: "PAUSED", elapsedMs: elapsed(attempt), activeSince: null, events: [...attempt.events, nowEvent("MISSION_PAUSE")] },
      })),
      resume: () => set(({ attempt }) => attempt.status !== "PAUSED" ? { attempt } : ({
        attempt: { ...attempt, status: "IN_PROGRESS", activeSince: Date.now(), events: [...attempt.events, nowEvent("MISSION_RESUME"), nowEvent("PAUSE_RESUME")] },
      })),
      setDraft: (draft) => set({ draft }),
      submit: () => {
        const { attempt, draft } = get();
        if (attempt.status !== "IN_PROGRESS") return;
        const step = runtimeDemoMission.steps[attempt.currentStepIndex];
        const attemptNumber = (attempt.attempts[step.id] ?? 0) + 1;
        const result = evaluateMissionStep(step, draft, attemptNumber);
        set({ attempt: {
          ...attempt,
          responses: { ...attempt.responses, [step.id]: draft },
          attempts: { ...attempt.attempts, [step.id]: attemptNumber },
          feedback: { ...attempt.feedback, [step.id]: result },
          events: [...attempt.events, nowEvent("STEP_ATTEMPT", step.id, attemptNumber), ...(result.correct && attemptNumber > 1 ? [nowEvent("RETRY_SUCCESS", step.id, attemptNumber)] : []), ...(step.kind === "self_assessment" ? [nowEvent("SELF_REPORTED_FRICTION", step.id, Number(draft))] : [])],
        }});
      },
      retry: () => {
        const { attempt } = get();
        const step = runtimeDemoMission.steps[attempt.currentStepIndex];
        const feedback = { ...attempt.feedback };
        delete feedback[step.id];
        set({ draft: "", attempt: { ...attempt, feedback, events: [...attempt.events, nowEvent("RETRY_COUNT", step.id)] } });
      },
      showHint: () => {
        const { attempt } = get();
        if (attempt.status !== "IN_PROGRESS") return;
        const step = runtimeDemoMission.steps[attempt.currentStepIndex];
        const current = attempt.hintsUsed[step.id] ?? 0;
        if (current >= (step.hints?.length ?? 0)) return;
        if (current > 0 && (attempt.attempts[step.id] ?? 0) === 0) return;
        set({ attempt: { ...attempt, hintsUsed: { ...attempt.hintsUsed, [step.id]: current + 1 }, events: [...attempt.events, nowEvent("HINT_USAGE", step.id, current + 1)] } });
      },
      continueStep: () => {
        const { attempt } = get();
        const step = runtimeDemoMission.steps[attempt.currentStepIndex];
        const result: MissionFeedback | undefined = attempt.feedback[step.id];
        if (!result?.correct) return;
        const completed = Array.from(new Set([...attempt.completedStepIds, step.id]));
        const last = attempt.currentStepIndex === runtimeDemoMission.steps.length - 1;
        set({
          draft: "",
          attempt: {
            ...attempt,
            status: last ? "COMPLETED" : "IN_PROGRESS",
            currentStepIndex: last ? attempt.currentStepIndex : attempt.currentStepIndex + 1,
            completedStepIds: completed,
            elapsedMs: last ? elapsed(attempt) : attempt.elapsedMs,
            activeSince: last ? null : attempt.activeSince,
            completedAt: last ? Date.now() : null,
            events: [...attempt.events, nowEvent("STEP_COMPLETE", step.id), ...(last ? [nowEvent("MISSION_COMPLETION")] : [])],
          },
        });
      },
      reset: () => set({ attempt: createAttempt(), draft: "" }),
    }),
    {
      name: "engineer-learning-os:mission-runtime:v1",
      skipHydration: true,
      partialize: ({ attempt, draft }) => ({ attempt, draft }),
    },
  ),
);
