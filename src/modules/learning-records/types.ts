export const COMPETENCY_STATUSES = [
  "NOT_SEEN",
  "INTRODUCED",
  "FRAGILE",
  "PRACTICED",
  "DEMONSTRATED",
  "RETAINED",
] as const;

export type CompetencyStatus = (typeof COMPETENCY_STATUSES)[number];
export type CompetencyId = "EXCEL_CSV_IMPORT" | "TECHNICAL_ENGLISH_EXPLANATION";
export type VerificationStatus = "PENDING" | "VALID" | "INVALID" | "UNVERIFIED";
export type EvidenceType = "MISSION_ATTEMPT" | "MISSION_COMPLETION" | "REVIEW_RESULT" | "AUDIO_RESPONSE" | "TEXT_RESPONSE";

export const COMPETENCY_SEMANTICS: Record<CompetencyStatus, string> = {
  NOT_SEEN: "Aucune preuve significative.",
  INTRODUCED: "Notion rencontrée sans performance autonome réussie.",
  FRAGILE: "Performance incomplète, irrégulière ou fortement assistée.",
  PRACTICED: "Compétence réalisée avec succès dans un contexte guidé.",
  DEMONSTRATED: "Compétence réalisée avec un soutien réduit ou dans un contexte indépendant.",
  RETAINED: "Compétence démontrée de nouveau après un délai significatif.",
};

export const COMPETENCY_LABELS: Record<CompetencyStatus, string> = {
  NOT_SEEN: "À découvrir",
  INTRODUCED: "Découverte",
  FRAGILE: "Fragile",
  PRACTICED: "Pratiquée",
  DEMONSTRATED: "Démontrée",
  RETAINED: "Retenue",
};

export type ArtifactReference = {
  id: string;
  displayName: string;
  mimeType: string;
  size: number;
  storedAt: number;
  verificationStatus: "UNVERIFIED";
  durationMs?: number;
};

export type EvidenceEvaluation = {
  outcome: "ENCOUNTERED" | "INCOMPLETE" | "SUCCESSFUL_GUIDED" | "REVIEW_SUCCESS" | "REVIEW_FAILURE";
  delimiterDiagnostic: VerificationStatus;
  anomalyIdentification: VerificationStatus;
  missionCompletion: VerificationStatus;
  technicalConceptCoverage?: { found: string[]; missing: string[] };
  transcriptionStatus?: "UNAVAILABLE" | "MANUAL_AVAILABLE";
  feedbackStatus?: "AVAILABLE" | "UNAVAILABLE_NO_TRANSCRIPT";
  captureStatus?: "VALID" | "INVALID" | "NOT_APPLICABLE";
  languageStatus?: "TARGET_LANGUAGE_CONFIRMED" | "TARGET_LANGUAGE_NOT_CONFIRMED" | "UNKNOWN";
  contentStatus?: "SUFFICIENT" | "PARTIAL" | "INSUFFICIENT" | "UNKNOWN";
  competencyEvidenceStatus?: "VALID" | "PARTIAL" | "INVALID" | "UNEVALUATED";
};

export type EvidenceRecord = {
  id: string;
  attemptId: string;
  missionId: string;
  missionVersion: number;
  competencyIds: CompetencyId[];
  createdAt: number;
  evidenceType: EvidenceType;
  artifactReference: ArtifactReference | null;
  learnerResponses: Record<string, string>;
  evaluationResult: EvidenceEvaluation;
  assistance: {
    hintCount: number;
    retryCount: number;
  };
  selfEvaluation: number | null;
  sourceClassification: "PERSONAL";
  verificationStatus: VerificationStatus;
  relatedEvidenceIds?: string[];
};

export type CompetencyRecord = {
  competencyId: CompetencyId;
  status: CompetencyStatus;
  updatedAt: number | null;
  supportingEvidenceIds: string[];
  latestEvidenceId: string | null;
  confidence: "NONE" | "LOW" | "MEDIUM" | "HIGH";
  rationale: string;
};

export type LearningRecordEventType =
  | "EVIDENCE_CREATED"
  | "EVIDENCE_VIEWED"
  | "COMPETENCY_STATE_UPDATED"
  | "COMPETENCY_EXPLANATION_VIEWED";

export type LearningRecordEvent = {
  id: string;
  type: LearningRecordEventType;
  at: number;
  evidenceId?: string;
  competencyId?: CompetencyId;
};
