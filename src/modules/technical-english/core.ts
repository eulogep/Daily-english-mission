import type { EvidenceRecord } from "../learning-records/types";
import type { ErrorSignal } from "../review-engine/types";
import type { AudioBinaryStore, AudioEvidenceService, SpeakingMode, TechnicalEnglishAttempt, TechnicalEnglishEvaluation, TechnicalEnglishFeedback } from "./types";

export const TECHNICAL_ENGLISH_MISSION_ID = "technical-english-csv-explanation-v1" as const;
export const MAX_FLUENCY_CORRECTIONS = 3;
export const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
export const TARGET_CONCEPTS = ["csv", "delimiter", "column", "import", "preview"] as const;

const conceptAliases: Record<(typeof TARGET_CONCEPTS)[number], string[]> = {
  csv: ["csv", "file"],
  delimiter: ["delimiter", "delimiteur", "separator", "separateur", "comma", "semicolon"],
  column: ["column", "columns", "colonne", "colonnes", "field", "fields"],
  import: ["import", "open", "opens", "opening", "load", "loading"],
  preview: ["preview", "apercu"],
};

const englishSignals = new Set(["i", "a", "an", "the", "and", "to", "in", "if", "is", "are", "am", "it", "this", "that", "when", "first", "should", "would", "during", "used", "into", "each", "correct", "make", "sure", "can"]);
const frenchSignals = new Set(["je", "j", "le", "la", "les", "un", "une", "des", "de", "du", "et", "en", "dans", "que", "qui", "pour", "avec", "mon", "ma", "mes", "suis", "est", "il", "faut", "cette", "ca", "lorsque"]);
const actionSignals = new Set(["check", "choose", "select", "verify", "use", "change", "set", "open", "opens", "opening", "import", "inspect", "look"]);
const explanationSignals = new Set(["first", "then", "because", "so", "should", "would", "make", "ensure", "correct", "split", "separate", "separated", "each"]);

export function createTechnicalEnglishAttempt(at = Date.now(), id?: string): TechnicalEnglishAttempt {
  return {
    id: id ?? `technical-english-${at}-${globalThis.crypto.randomUUID()}`,
    missionId: TECHNICAL_ENGLISH_MISSION_ID,
    createdAt: at,
    status: "READY",
    mode: "FLUENCY_MODE",
    modality: "AUDIO",
    audioReference: null,
    textResponse: "",
    manualTranscript: "",
    transcriptionStatus: "UNAVAILABLE",
    evaluation: null,
    feedback: null,
    comfort: null,
    explainAgain: null,
    hardestWord: "",
    completedAt: null,
    events: [],
  };
}

function normalize(value: string) {
  return value.toLocaleLowerCase("en-US").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s_-]/g, " ").replace(/\s+/g, " ").trim();
}

export function evaluateTechnicalEnglishText(value: string): TechnicalEnglishEvaluation {
  const normalized = normalize(value);
  if (!normalized) return {
    available: false,
    passed: false,
    languageStatus: "UNKNOWN",
    contentStatus: "UNKNOWN",
    competencyEvidenceStatus: "UNEVALUATED",
    foundConcepts: [],
    missingConcepts: [...TARGET_CONCEPTS],
    wordCount: 0,
  };
  const words = normalized.split(" ").filter(Boolean);
  const foundConcepts = TARGET_CONCEPTS.filter((concept) => conceptAliases[concept].some((alias) => words.includes(alias)));
  const englishCount = words.filter((word) => englishSignals.has(word)).length;
  const frenchCount = words.filter((word) => frenchSignals.has(word)).length;
  const languageStatus = frenchCount >= 3 && frenchCount >= englishCount + 2
    ? "TARGET_LANGUAGE_NOT_CONFIRMED" as const
    : englishCount >= 3 && englishCount >= frenchCount + 1
      ? "TARGET_LANGUAGE_CONFIRMED" as const
      : "UNKNOWN" as const;
  const promptCopied = normalized.includes("explain in english what you should check when a csv opens in one column");
  const hasAction = words.some((word) => actionSignals.has(word));
  const hasExplanation = words.some((word) => explanationSignals.has(word));
  const contentSufficient = !promptCopied
    && words.length >= 12
    && hasAction
    && (foundConcepts.length >= 3 || (foundConcepts.length >= 2 && hasExplanation));
  const contentStatus = contentSufficient
    ? "SUFFICIENT" as const
    : foundConcepts.length >= 2 || (foundConcepts.length >= 1 && words.length >= 10)
      ? "PARTIAL" as const
      : "INSUFFICIENT" as const;
  const competencyEvidenceStatus = languageStatus === "TARGET_LANGUAGE_NOT_CONFIRMED" || contentStatus === "INSUFFICIENT"
    ? "INVALID" as const
    : languageStatus === "UNKNOWN"
      ? "UNEVALUATED" as const
      : contentStatus === "SUFFICIENT"
        ? "VALID" as const
        : "PARTIAL" as const;
  return {
    available: true,
    passed: competencyEvidenceStatus === "VALID",
    languageStatus,
    contentStatus,
    competencyEvidenceStatus,
    foundConcepts,
    missingConcepts: TARGET_CONCEPTS.filter((concept) => !foundConcepts.includes(concept)),
    wordCount: words.length,
  };
}

export function buildTechnicalEnglishFeedback(evaluation: TechnicalEnglishEvaluation, mode: SpeakingMode): TechnicalEnglishFeedback {
  if (!evaluation.available) {
    return { availability: "UNAVAILABLE_NO_TRANSCRIPT", whatWorked: ["Audio enregistré localement."], corrections: [], tryAgain: "Ajoute une transcription manuelle si tu veux un feedback déterministe sur le contenu." };
  }
  if (evaluation.languageStatus === "TARGET_LANGUAGE_NOT_CONFIRMED") {
    return {
      availability: "AVAILABLE",
      whatWorked: ["La tentative et sa transcription sont conservées localement."],
      corrections: ["Réponds principalement en anglais pour valider l’objectif de cette mission."],
      tryAgain: "Explique en anglais le contrôle du délimiteur pendant l’import du CSV.",
    };
  }
  const whatWorked = evaluation.foundConcepts.length > 0
    ? [`Concepts techniques présents : ${evaluation.foundConcepts.join(", ")}.`]
    : ["Une réponse a bien été produite."];
  if (evaluation.contentStatus === "SUFFICIENT") whatWorked.push("La réponse relie suffisamment le problème à une action technique.");
  const corrections = evaluation.missingConcepts.map((concept) => `Ajoute le concept « ${concept} » pour rendre l’explication plus précise.`);
  if (mode === "ACCURACY_MODE" && evaluation.wordCount < 20) corrections.push("Utilise une structure simple : problème, contrôle à effectuer, résultat attendu.");
  const limit = mode === "FLUENCY_MODE" ? MAX_FLUENCY_CORRECTIONS : 5;
  return {
    availability: "AVAILABLE",
    whatWorked,
    corrections: corrections.slice(0, limit),
    tryAgain: evaluation.passed ? "Refais l’explication sans lire pour consolider le vocabulaire." : "Réessaie en reliant le problème, le délimiteur et le résultat dans Excel.",
  };
}

export function validateAudioBlob(blob: Pick<Blob, "size" | "type">) {
  if (!blob.type.startsWith("audio/")) return "Le format enregistré n’est pas reconnu comme audio.";
  if (blob.size <= 0) return "L’enregistrement est vide.";
  if (blob.size > MAX_AUDIO_BYTES) return "L’enregistrement dépasse la limite locale de 10 Mo.";
  return null;
}

export function microphoneErrorMessage(error: unknown) {
  const name = error instanceof DOMException ? error.name : error instanceof Error ? error.name : "UnknownError";
  if (name === "NotAllowedError" || name === "SecurityError") return "Autorise l’accès au microphone pour répondre oralement. Tu peux aussi écrire ta réponse.";
  if (name === "NotFoundError" || name === "DevicesNotFoundError") return "Aucun microphone n’a été détecté. Utilise la réponse écrite à la place.";
  if (name === "NotSupportedError") return "L’enregistrement audio n’est pas pris en charge par ce navigateur. Utilise la réponse écrite.";
  return "L’enregistrement n’a pas pu démarrer. Tu peux réessayer ou écrire ta réponse.";
}

export function createAudioEvidenceService(store: AudioBinaryStore, idFactory = () => globalThis.crypto.randomUUID(), now = () => Date.now()): AudioEvidenceService {
  return {
    async save(blob, durationMs) {
      const error = validateAudioBlob(blob);
      if (error) throw new Error(error);
      const id = idFactory();
      const metadata = {
        id,
        displayName: `reponse-audio-${id.slice(0, 8)}.webm`,
        mimeType: blob.type,
        size: blob.size,
        storedAt: now(),
        durationMs,
        verificationStatus: "UNVERIFIED" as const,
      };
      await store.put(id, blob, metadata);
      return metadata;
    },
    load(reference) { return store.get(reference.id); },
    remove(reference) { return store.delete(reference.id); },
  };
}

export function technicalEnglishEvidenceFromAttempt(attempt: TechnicalEnglishAttempt): EvidenceRecord | null {
  if (attempt.status !== "COMPLETED" || attempt.completedAt === null) return null;
  const source = attempt.modality === "TEXT" ? attempt.textResponse : attempt.manualTranscript;
  const evaluation = evaluateTechnicalEnglishText(source);
  const evidenceType = attempt.modality === "AUDIO" ? "AUDIO_RESPONSE" as const : "TEXT_RESPONSE" as const;
  const captureStatus = attempt.modality === "AUDIO"
    ? attempt.audioReference ? "VALID" as const : "INVALID" as const
    : "NOT_APPLICABLE" as const;
  const competencyEvidenceStatus = captureStatus === "INVALID" ? "INVALID" as const : evaluation.competencyEvidenceStatus;
  const verificationStatus = competencyEvidenceStatus === "VALID"
    ? "VALID" as const
    : competencyEvidenceStatus === "PARTIAL"
      ? "PENDING" as const
      : competencyEvidenceStatus === "INVALID"
        ? "INVALID" as const
        : "UNVERIFIED" as const;
  return {
    id: `${attempt.id}:${evidenceType}`,
    attemptId: attempt.id,
    missionId: attempt.missionId,
    missionVersion: 1,
    competencyIds: ["TECHNICAL_ENGLISH_EXPLANATION"],
    createdAt: attempt.completedAt,
    evidenceType,
    artifactReference: attempt.audioReference,
    learnerResponses: {
      ...(attempt.textResponse ? { textResponse: attempt.textResponse } : {}),
      ...(attempt.manualTranscript ? { manualTranscript: attempt.manualTranscript } : {}),
      explainAgain: attempt.explainAgain ?? "",
      hardestWord: attempt.hardestWord,
    },
    evaluationResult: {
      outcome: competencyEvidenceStatus === "VALID" ? "SUCCESSFUL_GUIDED" : competencyEvidenceStatus === "PARTIAL" ? "INCOMPLETE" : "ENCOUNTERED",
      delimiterDiagnostic: "PENDING",
      anomalyIdentification: "PENDING",
      missionCompletion: "VALID",
      technicalConceptCoverage: { found: evaluation.foundConcepts, missing: evaluation.missingConcepts },
      transcriptionStatus: attempt.transcriptionStatus,
      feedbackStatus: attempt.feedback?.availability ?? "UNAVAILABLE_NO_TRANSCRIPT",
      captureStatus,
      languageStatus: evaluation.languageStatus,
      contentStatus: evaluation.contentStatus,
      competencyEvidenceStatus,
    },
    assistance: { hintCount: 0, retryCount: attempt.events.filter((event) => event.type === "AUDIO_RECORDING_RETRIED").length },
    selfEvaluation: attempt.comfort,
    sourceClassification: "PERSONAL",
    verificationStatus,
  };
}

export function technicalEnglishErrorSignals(attempt: TechnicalEnglishAttempt, availableEvidenceIds: string[]): ErrorSignal[] {
  const evidenceType = attempt.modality === "AUDIO" ? "AUDIO_RESPONSE" : "TEXT_RESPONSE";
  const sourceEvidenceId = `${attempt.id}:${evidenceType}`;
  if (!availableEvidenceIds.includes(sourceEvidenceId) || !attempt.evaluation?.available) return [];
  if (attempt.evaluation.languageStatus !== "TARGET_LANGUAGE_CONFIRMED") return [];
  if (attempt.evaluation.missingConcepts.length < 2 && attempt.evaluation.wordCount >= 8) return [];
  return [{
    id: `${attempt.id}:INCOMPLETE_RESPONSE:TECHNICAL_CSV_EXPLANATION`,
    competencyId: "TECHNICAL_ENGLISH_EXPLANATION",
    sourceEvidenceId,
    missionId: attempt.missionId,
    attemptId: attempt.id,
    errorType: "INCOMPLETE_RESPONSE",
    concept: "TECHNICAL_CSV_EXPLANATION",
    description: "L’explication technique omet plusieurs concepts nécessaires pour diagnostiquer le CSV.",
    observedAt: attempt.completedAt ?? attempt.createdAt,
    severity: "LOW",
  }];
}
