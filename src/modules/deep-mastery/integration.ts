import type { EvidenceRecord } from "../learning-records/types";
import type { ErrorSignal, ReviewConcept } from "../review-engine/types";
import type { DeepMasteryAttempt, DeepMasteryDefinition } from "./types";

function count(values: Record<string, number>) {
  return Object.values(values).reduce((total, value) => total + value, 0);
}

export function transferIsIndependent(attempt: DeepMasteryAttempt, definition: DeepMasteryDefinition) {
  const id = definition.transferChallenge.id;
  return attempt.feedback[id]?.correct === true
    && (attempt.hintsUsed[id] ?? 0) <= definition.completionCriteria.maxTransferHintsForDemonstrated
    && (attempt.retries[id] ?? 0) <= definition.completionCriteria.maxTransferRetriesForDemonstrated;
}

export function deepMasteryOutcome(attempt: DeepMasteryAttempt, definition: DeepMasteryDefinition) {
  const feynmanSuccessful = attempt.feedback[definition.feynmanPrompt.id]?.correct === true;
  const transferSuccessful = attempt.feedback[definition.transferChallenge.id]?.correct === true;
  const demonstrated = attempt.status === "COMPLETED"
    && (!definition.completionCriteria.requireFeynmanSuccess || feynmanSuccessful)
    && (!definition.completionCriteria.requireTransferSuccess || transferSuccessful)
    && transferIsIndependent(attempt, definition);
  return {
    feynmanSuccessful,
    transferSuccessful,
    demonstrated,
    maxState: demonstrated ? "DEMONSTRATED" as const : attempt.status === "COMPLETED" ? "PRACTICED" as const : attempt.startedAt ? "INTRODUCED" as const : "NOT_SEEN" as const,
  };
}

function evaluation(attempt: DeepMasteryAttempt, definition: DeepMasteryDefinition) {
  const outcome = deepMasteryOutcome(attempt, definition);
  return {
    outcome: outcome.demonstrated ? "SUCCESSFUL_TRANSFER" as const : attempt.status === "COMPLETED" ? "SUCCESSFUL_GUIDED" as const : attempt.events.some((event) => event.type === "ANSWER_INCORRECT") ? "INCOMPLETE" as const : "ENCOUNTERED" as const,
    delimiterDiagnostic: outcome.transferSuccessful ? "VALID" as const : "PENDING" as const,
    anomalyIdentification: "PENDING" as const,
    missionCompletion: attempt.status === "COMPLETED" ? "VALID" as const : "PENDING" as const,
    feynmanExplanation: outcome.feynmanSuccessful ? "VALID" as const : "PENDING" as const,
    heldOutTransfer: outcome.transferSuccessful ? "VALID" as const : "PENDING" as const,
    independence: outcome.demonstrated ? "LIMITED_HELP" as const : "GUIDED" as const,
  };
}

function record(attempt: DeepMasteryAttempt, definition: DeepMasteryDefinition, completed: boolean): EvidenceRecord {
  const selfEvaluation = Number(attempt.responses["self-evaluation"] ?? attempt.confidence["self-evaluation"]);
  return {
    id: `${attempt.id}:${completed ? "DEEP_MASTERY_COMPLETION" : "DEEP_MASTERY_ATTEMPT"}`,
    attemptId: attempt.id,
    missionId: definition.id,
    missionVersion: definition.version,
    competencyIds: definition.competencies,
    createdAt: completed ? attempt.completedAt! : attempt.startedAt!,
    evidenceType: "DEEP_MASTERY_SESSION",
    artifactReference: null,
    learnerResponses: { ...attempt.responses },
    evaluationResult: evaluation(attempt, definition),
    assistance: { hintCount: count(attempt.hintsUsed), retryCount: count(attempt.retries) },
    selfEvaluation: Number.isInteger(selfEvaluation) && selfEvaluation >= 1 && selfEvaluation <= 5 ? selfEvaluation : null,
    sourceClassification: "PERSONAL",
    verificationStatus: "VALID",
  };
}

export function deepMasteryEvidenceFromAttempt(attempt: DeepMasteryAttempt, definition: DeepMasteryDefinition): EvidenceRecord[] {
  if (attempt.startedAt === null) return [];
  const records = [record(attempt, definition, false)];
  if (attempt.status === "COMPLETED" && attempt.completedAt !== null) records.push(record(attempt, definition, true));
  return records;
}

const reviewConcept = (tag: string): ReviewConcept => tag === "CSV_DELIMITER_VS_ENCODING"
  ? "CSV_DELIMITER_VS_ENCODING"
  : tag === "CSV_SEPARATOR_TRANSFER"
    ? "CSV_SEPARATOR_TRANSFER"
    : "CSV_DELIMITER_DIAGNOSIS";

export function deepMasteryErrorSignals(attempt: DeepMasteryAttempt, definition: DeepMasteryDefinition, evidenceIds: string[]): ErrorSignal[] {
  const sourceEvidenceId = `${attempt.id}:DEEP_MASTERY_ATTEMPT`;
  if (!evidenceIds.includes(sourceEvidenceId)) return [];
  return attempt.events.flatMap((event) => {
    if (event.type !== "ANSWER_INCORRECT" || !event.stepId) return [];
    const tags = event.misconceptionTags?.length ? event.misconceptionTags : ["CSV_DELIMITER_DIAGNOSIS"];
    return tags.map((tag) => ({
      id: `${attempt.id}:${event.stepId}:${event.attemptNumber ?? 1}:${tag}`,
      competencyId: definition.competencies[0],
      sourceEvidenceId,
      missionId: definition.id,
      attemptId: attempt.id,
      errorType: "INCOMPLETE_RESPONSE" as const,
      concept: reviewConcept(tag),
      description: tag === "CSV_DELIMITER_VS_ENCODING" ? "Le délimiteur et l’encodage ont été confondus." : tag === "CSV_SEPARATOR_TRANSFER" ? "Le séparateur du cas nouveau n’a pas été reconnu." : "Le diagnostic du délimiteur doit être consolidé.",
      observedAt: event.at,
      severity: event.stepId === definition.transferChallenge.id ? "HIGH" as const : "MEDIUM" as const,
    }));
  });
}
