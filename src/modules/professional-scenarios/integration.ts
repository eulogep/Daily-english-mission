import type { CompetencyId, EvidenceRecord, ProfessionalEvaluationDimension, VerificationStatus } from "../learning-records/types";
import type { ErrorSignal, ReviewConcept } from "../review-engine/types";
import type { ProfessionalErrorTag, ProfessionalScenarioAttempt, ProfessionalScenarioDefinition } from "./types";

const count = (values: Record<string, number>) => Object.values(values).reduce((total, value) => total + value, 0);

function evidenceDimensions(attempt: ProfessionalScenarioAttempt, definition: ProfessionalScenarioDefinition): Partial<Record<ProfessionalEvaluationDimension, VerificationStatus>> {
  return Object.fromEntries(definition.evaluationPolicy.dimensions.map((dimension) => {
    const relevant = definition.tasks.filter((task) => task.evaluationDimensions.includes(dimension));
    const results = relevant.map((task) => attempt.feedback[task.id]?.dimensions[dimension]?.status);
    const status = results.some((value) => value === "INVALID") ? "INVALID" : results.length > 0 && results.every((value) => value === "VALID") ? "VALID" : "PENDING";
    return [dimension, status];
  })) as Partial<Record<ProfessionalEvaluationDimension, VerificationStatus>>;
}

function evidenceRecord(attempt: ProfessionalScenarioAttempt, definition: ProfessionalScenarioDefinition, completed: boolean): EvidenceRecord {
  const dimensions = evidenceDimensions(attempt, definition);
  const writingTaskId = definition.communicationTask.taskId;
  const assistanceMode = attempt.assistanceUsed?.[writingTaskId];
  const externalFinalResponse = assistanceMode === "EXTERNAL_AI" || assistanceMode === undefined;
  const writingEvidence = assistanceMode === "NONE"
    ? "INDEPENDENT" as const
    : externalFinalResponse
      ? "NOT_AUTONOMOUS_EXTERNAL_AI" as const
      : "GUIDED" as const;
  const competencyIds = completed && externalFinalResponse
    ? definition.competencies.filter((competencyId) => competencyId !== "PROFESSIONAL_STATUS_UPDATE")
    : definition.competencies;
  const notes = attempt.writingNotes?.[writingTaskId];
  return {
    id: `${attempt.id}:${completed ? "PROFESSIONAL_SCENARIO_COMPLETION" : "PROFESSIONAL_SCENARIO_ATTEMPT"}`,
    attemptId: attempt.id,
    missionId: definition.id,
    missionVersion: definition.version,
    competencyIds,
    createdAt: completed ? attempt.completedAt! : attempt.startedAt!,
    evidenceType: "PROFESSIONAL_SCENARIO",
    artifactReference: null,
    learnerResponses: {
      ...attempt.responses,
      ...(notes ? {
        "writing-note-observation": notes.observation,
        "writing-note-impact": notes.impact,
        "writing-note-uncertainty": notes.uncertainty,
        "writing-note-next-action": notes.nextAction,
      } : {}),
    },
    evaluationResult: {
      outcome: completed ? "SUCCESSFUL_GUIDED" : attempt.events.some((event) => event.type === "RESPONSE_REJECTED") ? "INCOMPLETE" : "ENCOUNTERED",
      delimiterDiagnostic: "PENDING",
      anomalyIdentification: dimensions.PROBLEM_IDENTIFICATION ?? "PENDING",
      missionCompletion: completed ? "VALID" : "PENDING",
      independence: "GUIDED",
      professionalDimensions: dimensions,
      scenarioRole: definition.role,
      dataClassification: definition.dataClassification,
      assistanceMode: assistanceMode ?? "OTHER",
      professionalWritingEvidence: writingEvidence,
    },
    assistance: { hintCount: count(attempt.hintsUsed), retryCount: count(attempt.retries) },
    selfEvaluation: attempt.confidence,
    sourceClassification: "PERSONAL",
    verificationStatus: "VALID",
  };
}

export function professionalScenarioEvidenceFromAttempt(attempt: ProfessionalScenarioAttempt, definition: ProfessionalScenarioDefinition): EvidenceRecord[] {
  if (attempt.startedAt === null) return [];
  const records = [evidenceRecord(attempt, definition, false)];
  if (attempt.status === "COMPLETED" && attempt.completedAt !== null) records.push(evidenceRecord(attempt, definition, true));
  return records;
}

const tagMapping: Record<ProfessionalErrorTag, { competencyId: CompetencyId; concept: ReviewConcept; description: string; errorType: ErrorSignal["errorType"] }> = {
  MISSED_DATA_ANOMALY: { competencyId: "DATA_ANOMALY_IDENTIFICATION", concept: "MISSED_DATA_ANOMALY", description: "L’anomalie principale n’a pas été identifiée à partir du KPI fourni.", errorType: "DATA_INSPECTION_ERROR" },
  CONFUSED_FACT_AND_ASSUMPTION: { competencyId: "FACT_VS_ASSUMPTION", concept: "CONFUSED_FACT_AND_ASSUMPTION", description: "Une hypothèse a été présentée comme un fait observé.", errorType: "INCOMPLETE_RESPONSE" },
  OVERCLAIM_WITHOUT_EVIDENCE: { competencyId: "FACT_VS_ASSUMPTION", concept: "OVERCLAIM_WITHOUT_EVIDENCE", description: "La conclusion dépasse les éléments disponibles.", errorType: "INCOMPLETE_RESPONSE" },
  NO_NEXT_ACTION: { competencyId: "ACTIONABLE_NEXT_STEP", concept: "NO_NEXT_ACTION", description: "Le point de situation ne propose pas de vérification concrète.", errorType: "INCOMPLETE_RESPONSE" },
};

export function professionalScenarioErrorSignals(attempt: ProfessionalScenarioAttempt, definition: ProfessionalScenarioDefinition, evidenceIds: string[]): ErrorSignal[] {
  const sourceEvidenceId = `${attempt.id}:PROFESSIONAL_SCENARIO_ATTEMPT`;
  if (!evidenceIds.includes(sourceEvidenceId)) return [];
  return attempt.events.flatMap((event) => {
    if (event.type !== "RESPONSE_REJECTED" || !event.taskId || !event.errorTags?.length) return [];
    return event.errorTags.map((tag) => {
      const mapped = tagMapping[tag];
      return {
        id: `${attempt.id}:${event.taskId}:${event.attemptNumber ?? 1}:${tag}`,
        competencyId: mapped.competencyId,
        sourceEvidenceId,
        missionId: definition.id,
        attemptId: attempt.id,
        errorType: mapped.errorType,
        concept: mapped.concept,
        description: mapped.description,
        observedAt: event.at,
        severity: tag === "OVERCLAIM_WITHOUT_EVIDENCE" ? "HIGH" as const : "MEDIUM" as const,
      };
    });
  });
}
