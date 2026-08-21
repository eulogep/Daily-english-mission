import type { MissionAttempt, MissionDefinition, MissionEvent } from "./types";

const eventAt = (type: MissionEvent["type"], at: number): MissionEvent => ({ type, at });
export const MAX_PLAUSIBLE_LEGACY_ACTIVE_MS = 6 * 60 * 60 * 1000;

export function createMissionAttempt(mission: MissionDefinition, at = Date.now()): MissionAttempt {
  return {
    id: `${mission.slug}-attempt`,
    createdAt: at,
    missionId: mission.id,
    missionVersion: mission.version,
    status: "READY",
    currentStepIndex: 0,
    completedStepIds: [],
    responses: {},
    evidence: {},
    attempts: {},
    hintsUsed: {},
    feedback: {},
    startedAt: null,
    activeSince: null,
    elapsedMs: 0,
    timingReliable: true,
    completedAt: null,
    events: [],
  };
}

export function elapsedMissionAttempt(attempt: MissionAttempt, at = Date.now()) {
  return attempt.elapsedMs + (attempt.activeSince ? at - attempt.activeSince : 0);
}

export function suspendMissionActivity(attempt: MissionAttempt, at = Date.now()): MissionAttempt {
  if (attempt.status !== "IN_PROGRESS" || attempt.activeSince === null) return attempt;
  return { ...attempt, elapsedMs: elapsedMissionAttempt(attempt, at), activeSince: null };
}

export function activateMissionActivity(attempt: MissionAttempt, at = Date.now()): MissionAttempt {
  if (attempt.status !== "IN_PROGRESS" || attempt.activeSince !== null) return attempt;
  return { ...attempt, activeSince: at };
}

export function sanitizeHydratedMissionAttempt(attempt: MissionAttempt): MissionAttempt {
  const timingReliable = attempt.timingReliable ?? attempt.elapsedMs <= MAX_PLAUSIBLE_LEGACY_ACTIVE_MS;
  return { ...attempt, activeSince: null, timingReliable };
}

export function pauseMissionAttempt(attempt: MissionAttempt, at = Date.now()): MissionAttempt {
  if (attempt.status !== "IN_PROGRESS") return attempt;
  const suspended = suspendMissionActivity(attempt, at);
  return { ...suspended, status: "PAUSED", events: [...suspended.events, eventAt("MISSION_PAUSED", at)] };
}

export function resumeMissionAttempt(attempt: MissionAttempt, at = Date.now()): MissionAttempt {
  if (attempt.status !== "PAUSED") return attempt;
  return { ...attempt, status: "IN_PROGRESS", activeSince: at, events: [...attempt.events, eventAt("MISSION_RESUMED", at)] };
}
