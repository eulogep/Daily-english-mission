export type MissionStepKind =
  | "multiple_choice"
  | "short_answer"
  | "long_text"
  | "evidence_prompt"
  | "self_assessment";

export type MissionChoice = { id: string; label: string };

export type MissionStepDefinition = {
  id: string;
  kind: MissionStepKind;
  title: string;
  instruction: string;
  why?: string;
  example?: string;
  hints?: string[];
  choices?: MissionChoice[];
  correctChoiceId?: string;
  acceptedKeywords?: string[];
  minLength?: number;
  successFeedback: string;
  retryFeedback: string;
};

export type MissionDefinition = {
  id: string;
  slug: string;
  version: number;
  title: string;
  level: string;
  objective: string;
  reason: string;
  estimatedMinutes: number;
  steps: MissionStepDefinition[];
};

export type MissionFeedback = {
  correct: boolean;
  message: string;
  attemptNumber: number;
};

export type MissionEventType =
  | "TIME_TO_START_LEARNING"
  | "MISSION_START"
  | "MISSION_PAUSE"
  | "MISSION_RESUME"
  | "MISSION_COMPLETION"
  | "STEP_ABANDONMENT"
  | "STEP_ATTEMPT"
  | "STEP_COMPLETE"
  | "HINT_USAGE"
  | "RETRY_COUNT"
  | "RETRY_SUCCESS"
  | "PAUSE_RESUME"
  | "SELF_REPORTED_FRICTION";

export type MissionEvent = {
  type: MissionEventType;
  at: number;
  stepId?: string;
  value?: number;
};

export type MissionAttemptStatus = "READY" | "IN_PROGRESS" | "PAUSED" | "COMPLETED";

export type MissionAttempt = {
  id: string;
  createdAt: number;
  missionId: string;
  missionVersion: number;
  status: MissionAttemptStatus;
  currentStepIndex: number;
  completedStepIds: string[];
  responses: Record<string, string>;
  attempts: Record<string, number>;
  hintsUsed: Record<string, number>;
  feedback: Record<string, MissionFeedback>;
  startedAt: number | null;
  activeSince: number | null;
  elapsedMs: number;
  completedAt: number | null;
  events: MissionEvent[];
};
