import type { ArtifactReference, EvidenceRecord } from "../learning-records/types";

export type SpeakingMode = "FLUENCY_MODE" | "ACCURACY_MODE";
export type ResponseModality = "AUDIO" | "TEXT";
export type AudioRecordingState = "READY" | "RECORDING" | "RECORDED" | "PLAYING" | "SAVED" | "ERROR";
export type TranscriptionStatus = "UNAVAILABLE" | "MANUAL_AVAILABLE";
export type FeedbackAvailability = "AVAILABLE" | "UNAVAILABLE_NO_TRANSCRIPT";
export type SpeakingAttemptStatus = "READY" | "IN_PROGRESS" | "RESPONSE_SAVED" | "EVALUATED" | "COMPLETED";

export type AudioEvidenceReference = ArtifactReference & { durationMs: number };

export type TechnicalEnglishEvaluation = {
  available: boolean;
  passed: boolean;
  languageStatus: "TARGET_LANGUAGE_CONFIRMED" | "TARGET_LANGUAGE_NOT_CONFIRMED" | "UNKNOWN";
  contentStatus: "SUFFICIENT" | "PARTIAL" | "INSUFFICIENT" | "UNKNOWN";
  competencyEvidenceStatus: "VALID" | "PARTIAL" | "INVALID" | "UNEVALUATED";
  foundConcepts: string[];
  missingConcepts: string[];
  wordCount: number;
};

export type TechnicalEnglishFeedback = {
  availability: FeedbackAvailability;
  whatWorked: string[];
  corrections: string[];
  tryAgain: string;
};

export type TechnicalEnglishAttempt = {
  id: string;
  missionId: "technical-english-csv-explanation-v1";
  createdAt: number;
  status: SpeakingAttemptStatus;
  mode: SpeakingMode;
  modality: ResponseModality;
  audioReference: AudioEvidenceReference | null;
  textResponse: string;
  manualTranscript: string;
  transcriptionStatus: TranscriptionStatus;
  evaluation: TechnicalEnglishEvaluation | null;
  feedback: TechnicalEnglishFeedback | null;
  comfort: number | null;
  explainAgain: "YES" | "MAYBE" | "NO" | null;
  hardestWord: string;
  completedAt: number | null;
  events: TechnicalEnglishEvent[];
};

export type TechnicalEnglishEventType =
  | "AUDIO_RECORDING_STARTED"
  | "AUDIO_RECORDING_COMPLETED"
  | "AUDIO_RECORDING_RETRIED"
  | "AUDIO_PLAYED"
  | "TRANSCRIPTION_CREATED"
  | "TRANSCRIPTION_FAILED"
  | "FEEDBACK_VIEWED"
  | "SPEAKING_ATTEMPT_COMPLETED"
  | "SELF_EVALUATION_SUBMITTED";

export type TechnicalEnglishEvent = { type: TechnicalEnglishEventType; at: number; value?: number };

export interface AudioBinaryStore {
  put(id: string, blob: Blob, metadata: AudioEvidenceReference): Promise<void>;
  get(id: string): Promise<Blob | null>;
  delete(id: string): Promise<void>;
}

export type AudioEvidenceService = {
  save(blob: Blob, durationMs: number): Promise<AudioEvidenceReference>;
  load(reference: AudioEvidenceReference): Promise<Blob | null>;
  remove(reference: AudioEvidenceReference): Promise<void>;
};

export type TechnicalEnglishEvidence = EvidenceRecord;
