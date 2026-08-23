export type MissionStepKind =
  | "information"
  | "resource"
  | "multiple_choice"
  | "short_answer"
  | "long_text"
  | "evidence_prompt"
  | "evidence_submission"
  | "self_assessment";

export type MissionChoice = { id: string; label: string };

export type MissionResource = {
  href: string;
  label: string;
  downloadName: string;
  classification: "TRAINING_SYNTHETIC";
};

export type EvidenceMetadata = {
  id: string;
  displayName: string;
  mimeType: string;
  size: number;
  storedAt: number;
};

export type MissionStepDefinition = {
  id: string;
  kind: MissionStepKind;
  title: string;
  instruction: string;
  why?: string;
  example?: string;
  details?: string[];
  hints?: string[];
  choices?: MissionChoice[];
  correctChoiceId?: string;
  acceptedKeywords?: string[];
  acceptedKeywordGroups?: string[][];
  minLength?: number;
  resource?: MissionResource;
  successFeedback: string;
  retryFeedback: string;
};

export type MissionDefinition = {
  id: string;
  slug: string;
  version: number;
  title: string;
  subject?: string;
  competency?: string;
  level: string;
  objective: string;
  reason: string;
  estimatedMinutes: number;
  completionStatus?: "PRACTICED";
  completionSummary?: string[];
  sourceBundleIds?: string[];
  steps: MissionStepDefinition[];
};

export type MissionFeedback = {
  correct: boolean;
  message: string;
  attemptNumber: number;
};

export type MissionEventType =
  | "TIME_TO_START_LEARNING"
  | "MISSION_STARTED"
  | "STEP_VIEWED"
  | "ANSWER_SUBMITTED"
  | "ANSWER_CORRECT"
  | "ANSWER_INCORRECT"
  | "HINT_USED"
  | "RETRY"
  | "MISSION_PAUSED"
  | "MISSION_RESUMED"
  | "EVIDENCE_SUBMITTED"
  | "SELF_EVALUATION_SUBMITTED"
  | "MISSION_COMPLETED"
  | "STEP_COMPLETE";

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
  evidence: Record<string, EvidenceMetadata>;
  attempts: Record<string, number>;
  hintsUsed: Record<string, number>;
  feedback: Record<string, MissionFeedback>;
  startedAt: number | null;
  activeSince: number | null;
  elapsedMs: number;
  timingReliable: boolean;
  completedAt: number | null;
  events: MissionEvent[];
};
