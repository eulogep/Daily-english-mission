import type { CompetencyId, ProfessionalEvaluationDimension } from "../learning-records/types";

export type ProfessionalScenarioTaskType = "INSPECT" | "ANALYZE" | "DECIDE" | "WRITE" | "EXPLAIN" | "UPLOAD" | "VERIFY";
export type ProfessionalScenarioPhase = "BRIEF" | "CONTEXT" | "DATA" | "ANALYSIS" | "DECISION" | "PROFESSIONAL_RESPONSE" | "SELF_CHECK" | "EVIDENCE" | "COMPLETION";
export type ProfessionalScenarioResponseType = "MULTIPLE_CHOICE" | "LONG_TEXT";
export type SyntheticIndustrialRow = { Batch_ID: string; Site: string; Produced_Tons: number; Energy_kWh: number; Energy_kWh_per_Ton: number };
export type ProfessionalScenarioArtifact = { id: string; title: string; description: string; dataClassification: "TRAINING_SYNTHETIC"; columns: Array<keyof SyntheticIndustrialRow>; rows: SyntheticIndustrialRow[] };
export type ProfessionalScenarioChoice = { id: string; label: string };
export type ProfessionalErrorTag = "OVERCLAIM_WITHOUT_EVIDENCE" | "MISSED_DATA_ANOMALY" | "NO_NEXT_ACTION" | "CONFUSED_FACT_AND_ASSUMPTION";
export type ProfessionalAssistanceUsed = "NONE" | "IN_APP_SCAFFOLD" | "EXTERNAL_AI" | "OTHER";
export type ProfessionalWritingSection = "observation" | "impact" | "uncertainty" | "nextAction";
export type ProfessionalWritingNotes = Record<ProfessionalWritingSection, string>;
export type ProfessionalWritingCriterion = "OBSERVATION_PRESENT" | "UNCERTAINTY_PRESENT" | "NEXT_ACTION_PRESENT" | "NO_UNSUPPORTED_OVERCLAIM" | "PROFESSIONAL_CLARITY";
export type ProfessionalScenarioTask = {
  id: string; type: ProfessionalScenarioTaskType; phase: ProfessionalScenarioPhase; title: string; instruction: string;
  responseType: ProfessionalScenarioResponseType; choices?: ProfessionalScenarioChoice[]; correctChoiceId?: string;
  expectedConceptGroups?: string[][]; minLength?: number; hintLevels: string[]; errorTags: ProfessionalErrorTag[];
  successFeedback: string; retryFeedback: string; evaluationDimensions: ProfessionalEvaluationDimension[];
};
export type ProfessionalScenarioDefinition = {
  id: string; slug: string; version: number; title: string; domain: string; role: string; context: string;
  objectives: string[]; estimatedMinutes: number; competencies: CompetencyId[]; dataClassification: "TRAINING_SYNTHETIC";
  scenarioBrief: string; artifacts: ProfessionalScenarioArtifact[]; tasks: ProfessionalScenarioTask[];
  decisionPoints: Array<{ id: string; prompt: string; expectedAction: string }>;
  communicationTask: { taskId: string; expectedStructure: string[]; optionalEnglishPrompt: string };
  completionCriteria: { requiredTaskIds: string[]; maxStateFromGuidedScenario: "PRACTICED" };
  evidencePolicy: { sourceClassification: "PERSONAL"; retainAttemptHistory: true; retainedRequiresDelayedRetrieval: true };
  evaluationPolicy: { dimensions: ProfessionalEvaluationDimension[]; aggregatePercentageForbidden: true };
};
export type ProfessionalDimensionFeedback = { status: "PENDING" | "VALID" | "INVALID"; feedback: string };
export type ProfessionalScenarioFeedback = {
  correct: boolean; message: string; attemptNumber: number;
  dimensions: Partial<Record<ProfessionalEvaluationDimension, ProfessionalDimensionFeedback>>;
  errorTags: ProfessionalErrorTag[];
  writingCriteria?: Record<ProfessionalWritingCriterion, boolean>;
  missingElements?: string[];
};
export type ProfessionalScenarioEventType = "SCENARIO_STARTED" | "TASK_VIEWED" | "RESPONSE_ACCEPTED" | "RESPONSE_REJECTED" | "HINT_USED" | "RETRY" | "SCENARIO_PAUSED" | "SCENARIO_RESUMED" | "SCENARIO_COMPLETED";
export type ProfessionalScenarioEvent = { type: ProfessionalScenarioEventType; at: number; taskId?: string; attemptNumber?: number; errorTags?: ProfessionalErrorTag[] };
export type ProfessionalScenarioAttemptStatus = "READY" | "IN_PROGRESS" | "PAUSED" | "COMPLETED";
export type ProfessionalScenarioAttempt = {
  id: string; definitionId: string; definitionVersion: number; status: ProfessionalScenarioAttemptStatus; currentTaskIndex: number;
  completedTaskIds: string[]; responses: Record<string, string>; attempts: Record<string, number>; hintsUsed: Record<string, number>;
  retries: Record<string, number>; feedback: Record<string, ProfessionalScenarioFeedback>; confidence: number | null;
  assistanceUsed: Record<string, ProfessionalAssistanceUsed>; writingNotes: Record<string, ProfessionalWritingNotes>;
  startedAt: number | null; completedAt: number | null; updatedAt: number; events: ProfessionalScenarioEvent[];
};
export type ProfessionalScenarioStartupStatus = "LOADING" | "READY" | "RECOVERABLE_ERROR" | "COMPLETED";
