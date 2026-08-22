import type { CompetencyId } from "../learning-records/types";

export type DeepMasteryPhase =
  | "FOUNDATION"
  | "MENTAL_MODEL"
  | "RETRIEVAL"
  | "CONFUSIONS"
  | "CHALLENGE"
  | "FEYNMAN"
  | "TRANSFER"
  | "SELF_EVALUATION"
  | "COMPLETION";

export type DeepMasteryQuestionType = "MULTIPLE_CHOICE" | "SHORT_TEXT" | "EXPLANATION";
export type DeepMasteryDifficulty = 1 | 2 | 3 | 4 | 5;
export type DeepMasteryResponseMode = "WRITE" | "SPEAK" | "UPLOAD" | "DRAW";

export type DeepMasteryChoice = { id: string; label: string };

export type DeepMasteryContent = {
  id: string;
  phase: "FOUNDATION" | "MENTAL_MODEL";
  title: string;
  instruction: string;
  why?: string;
  keyPoints: string[];
};

export type DeepMasteryQuestion = {
  id: string;
  phase: Exclude<DeepMasteryPhase, "FOUNDATION" | "MENTAL_MODEL" | "SELF_EVALUATION" | "COMPLETION">;
  type: DeepMasteryQuestionType;
  title: string;
  instruction: string;
  why?: string;
  difficulty: DeepMasteryDifficulty;
  conceptId: string;
  responseModes: DeepMasteryResponseMode[];
  choices?: DeepMasteryChoice[];
  correctChoiceId?: string;
  expectedConceptGroups?: string[][];
  minLength?: number;
  misconceptionTags?: string[];
  hintLevels: string[];
  successFeedback: string;
  retryFeedback: string;
};

export type DeepMasteryCompletionCriteria = {
  requireFeynmanSuccess: boolean;
  requireTransferSuccess: boolean;
  maxTransferHintsForDemonstrated: number;
  maxTransferRetriesForDemonstrated: number;
};

export type DeepMasteryDefinition = {
  id: string;
  slug: string;
  version: number;
  title: string;
  subject: string;
  competencies: CompetencyId[];
  estimatedMinutes: number;
  foundation: DeepMasteryContent;
  mentalModel: DeepMasteryContent;
  confusions: DeepMasteryQuestion[];
  questions: DeepMasteryQuestion[];
  feynmanPrompt: DeepMasteryQuestion;
  transferChallenge: DeepMasteryQuestion;
  completionCriteria: DeepMasteryCompletionCriteria;
  evidencePolicy: {
    classification: "PERSONAL";
    maxStateFromSingleSession: "DEMONSTRATED";
    retainedRequiresLaterReview: true;
  };
};

export type DeepMasteryStep =
  | { kind: "CONTENT"; content: DeepMasteryContent }
  | { kind: "QUESTION"; question: DeepMasteryQuestion }
  | { kind: "SELF_EVALUATION"; id: "self-evaluation"; phase: "SELF_EVALUATION"; title: string; instruction: string };

export type DeepMasteryFeedback = {
  correct: boolean;
  message: string;
  attemptNumber: number;
};

export type DeepMasteryEventType =
  | "SESSION_STARTED"
  | "STEP_VIEWED"
  | "ANSWER_CORRECT"
  | "ANSWER_INCORRECT"
  | "HINT_USED"
  | "RETRY"
  | "SESSION_PAUSED"
  | "SESSION_RESUMED"
  | "SESSION_COMPLETED";

export type DeepMasteryEvent = {
  type: DeepMasteryEventType;
  at: number;
  stepId?: string;
  attemptNumber?: number;
  misconceptionTags?: string[];
};

export type DeepMasteryAttemptStatus = "READY" | "IN_PROGRESS" | "PAUSED" | "COMPLETED";

export type DeepMasteryAttempt = {
  id: string;
  definitionId: string;
  definitionVersion: number;
  status: DeepMasteryAttemptStatus;
  currentStepIndex: number;
  completedStepIds: string[];
  responses: Record<string, string>;
  confidence: Record<string, number>;
  attempts: Record<string, number>;
  hintsUsed: Record<string, number>;
  retries: Record<string, number>;
  feedback: Record<string, DeepMasteryFeedback>;
  startedAt: number | null;
  completedAt: number | null;
  updatedAt: number;
  events: DeepMasteryEvent[];
};

export type DeepMasteryStartupStatus = "LOADING" | "READY" | "RECOVERABLE_ERROR" | "COMPLETED";
