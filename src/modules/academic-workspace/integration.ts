import type { EvidenceRecord } from "../learning-records/types";
import type { ErrorSignal, ReviewConcept } from "../review-engine/types";
import type { AcademicQuizAttempt, AcademicQuizDefinition } from "./types";

const total = (values: Record<string, number>) => Object.values(values).reduce((sum, value) => sum + value, 0);

function record(attempt: AcademicQuizAttempt, definition: AcademicQuizDefinition, completed: boolean): EvidenceRecord {
  const sourceIds = [...new Set(definition.questions.map((question) => question.sourceId))];
  const sectionIds = [...new Set(definition.questions.map((question) => question.sectionId))];
  const conceptIds = [...new Set(definition.questions.flatMap((question) => question.conceptIds))];
  const pageReferences = Array.from(
    new Map(
      definition.questions
        .flatMap((question) => question.pageStart && question.pageEnd ? [{ sourceId: question.sourceId, pageStart: question.pageStart, pageEnd: question.pageEnd }] : [])
        .map((reference) => [`${reference.sourceId}:${reference.pageStart}:${reference.pageEnd}`, reference]),
    ).values(),
  );
  return {
    id: `${attempt.id}:${completed ? "ACADEMIC_QUIZ_COMPLETION" : "ACADEMIC_QUIZ_ATTEMPT"}`,
    attemptId: attempt.id,
    missionId: definition.id,
    missionVersion: definition.version,
    competencyIds: definition.competencyIds,
    createdAt: completed ? attempt.completedAt! : attempt.startedAt!,
    evidenceType: "ACADEMIC_QUIZ",
    artifactReference: null,
    learnerResponses: { ...attempt.responses },
    evaluationResult: {
      outcome: completed ? "SUCCESSFUL_GUIDED" : total(attempt.attempts) > 0 ? "INCOMPLETE" : "ENCOUNTERED",
      delimiterDiagnostic: "PENDING",
      anomalyIdentification: "PENDING",
      missionCompletion: completed ? "VALID" : "PENDING",
      independence: "GUIDED",
      academicSourceIds: sourceIds,
      academicSectionIds: sectionIds,
      academicConceptIds: conceptIds,
      academicPageReferences: pageReferences,
      academicGroundingStatus: "VERIFIED",
      academicRemediations: Object.values(attempt.remediations ?? {}).map((remediation) => ({
        questionId: remediation.questionId,
        sourceId: remediation.sourceId,
        sectionId: remediation.sectionId,
        conceptIds: remediation.conceptIds,
        selectedMethod: remediation.selectedMethod,
        postRemediationResult: remediation.postRemediationResult,
      })),
    },
    assistance: { hintCount: total(attempt.hintsUsed), retryCount: total(attempt.retries) },
    selfEvaluation: null,
    sourceClassification: "PERSONAL",
    verificationStatus: "VALID",
  };
}

export function academicEvidenceFromAttempt(attempt: AcademicQuizAttempt, definition: AcademicQuizDefinition) {
  if (attempt.startedAt === null) return [];
  const records = [record(attempt, definition, false)];
  if (attempt.status === "COMPLETED" && attempt.completedAt !== null) records.push(record(attempt, definition, true));
  return records;
}

export function academicErrorSignals(attempt: AcademicQuizAttempt, definition: AcademicQuizDefinition, evidenceIds: string[]): ErrorSignal[] {
  const sourceEvidenceId = `${attempt.id}:ACADEMIC_QUIZ_ATTEMPT`;
  if (!evidenceIds.includes(sourceEvidenceId)) return [];
  return definition.questions.flatMap((question) => {
    const failures = Math.max(0, (attempt.attempts[question.id] ?? 0) - (attempt.feedback[question.id]?.correct ? 1 : 0));
    if (failures === 0) return [];
    const transportQuestion = question.id === "tcp-property" || question.id === "pdf-transport-protocols";
    const encapsulationQuestion = question.conceptIds.includes("NETWORK_ENCAPSULATION");
    const concept: ReviewConcept = encapsulationQuestion ? "ENCAPSULATION_PDU_CONFUSION" : transportQuestion ? "TCP_UDP_CONFUSION" : "OSI_LAYER_MISCLASSIFICATION";
    const remediation = attempt.remediations?.[question.id];
    return [{
      id: `${attempt.id}:${question.id}:academic-error`,
      competencyId: transportQuestion ? "NETWORK_FUNDAMENTALS" : "OSI_TCP_IP_REASONING",
      sourceEvidenceId,
      missionId: definition.id,
      attemptId: attempt.id,
      errorType: "INCOMPLETE_RESPONSE" as const,
      concept,
      description: `La notion « ${question.prompt} » a nécessité une correction.`,
      observedAt: attempt.updatedAt,
      severity: failures >= 2 ? "HIGH" as const : "MEDIUM" as const,
      academicSourceId: question.sourceId,
      academicSectionId: question.sectionId,
      remediationUsed: Boolean(remediation?.selectedMethod),
      remediationMethod: remediation?.selectedMethod ?? null,
    }];
  });
}
