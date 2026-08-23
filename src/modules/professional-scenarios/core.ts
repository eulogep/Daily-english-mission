import type { ProfessionalEvaluationDimension } from "../learning-records/types";
import type {
  ProfessionalErrorTag,
  ProfessionalAssistanceUsed,
  ProfessionalScenarioAttempt,
  ProfessionalScenarioDefinition,
  ProfessionalScenarioFeedback,
  ProfessionalScenarioTask,
  ProfessionalWritingCriterion,
  ProfessionalWritingNotes,
  ProfessionalWritingSection,
} from "./types";

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr-FR").replace(/[^a-z0-9-]+/g, " ").trim();
const dimensionFeedback = (valid: boolean, validText: string, invalidText: string) => ({ status: valid ? "VALID" as const : "INVALID" as const, feedback: valid ? validText : invalidText });

function evaluateWrittenUpdate(task: ProfessionalScenarioTask, response: string, attemptNumber: number): ProfessionalScenarioFeedback {
  const answer = normalize(response);
  const observation = /(b-?104|lot 104)/.test(answer) && /(150|energie|kwh|consommation|valeur)/.test(answer);
  const uncertainty = /(a verifier|reste a|non confirme|ne permet pas|incert|possible|pourrait|peut etre|hypothese|cause inconnue|sans conclure)/.test(answer);
  const actionable = /(verifier|controler|confirmer|comparer|valider|examiner|analyser|rapprocher|demander|source|unite|calcul)/.test(answer);
  const enoughDetail = response.trim().length >= 90 && response.trim().split(/\s+/).length >= 16;
  const overclaim = /\b(forcement|certainement|prouve|prouvee|panne averee|est en panne|inefficace)\b/.test(answer);
  const criteria: Record<ProfessionalWritingCriterion, boolean> = {
    OBSERVATION_PRESENT: observation,
    UNCERTAINTY_PRESENT: uncertainty,
    NEXT_ACTION_PRESENT: actionable,
    NO_UNSUPPORTED_OVERCLAIM: !overclaim,
    PROFESSIONAL_CLARITY: enoughDetail,
  };
  const correct = Object.values(criteria).every(Boolean);
  const missingElements = [
    ...(!observation ? ["une observation précise du lot et de la métrique"] : []),
    ...(!uncertainty ? ["ce que tu ne peux pas encore confirmer"] : []),
    ...(!actionable ? ["la prochaine vérification à proposer"] : []),
    ...(overclaim ? ["une formulation prudente sans cause non démontrée"] : []),
    ...(!enoughDetail ? ["un message suffisamment clair et développé"] : []),
  ];
  const errorTags: ProfessionalErrorTag[] = [
    ...(overclaim || !uncertainty ? ["OVERCLAIM_WITHOUT_EVIDENCE" as const] : []),
    ...(!actionable ? ["NO_NEXT_ACTION" as const] : []),
  ];
  const message = correct
    ? task.successFeedback
    : `${observation ? "Ton observation est claire." : "Ton message est encore incomplet."} Il manque encore :\n- ${missingElements.join("\n- ")}`;
  return {
    correct,
    message,
    attemptNumber,
    errorTags,
    writingCriteria: criteria,
    missingElements,
    dimensions: {
      FACTUAL_ACCURACY: dimensionFeedback(observation && !overclaim, "Le lot et la valeur inhabituelle sont décrits précisément.", "L’observation doit nommer le lot et la métrique sans inventer de cause."),
      UNCERTAINTY_HANDLING: dimensionFeedback(uncertainty && !overclaim, "L’incertitude est explicite.", "La cause doit rester présentée comme non confirmée."),
      ACTIONABILITY: dimensionFeedback(actionable, "Une vérification concrète est proposée.", "Ajoute une prochaine vérification précise."),
      COMMUNICATION_CLARITY: dimensionFeedback(enoughDetail, "Le message contient les éléments attendus.", "Le message est trop court pour être actionnable."),
    },
  };
}

export function evaluateProfessionalTask(task: ProfessionalScenarioTask, response: string, attemptNumber: number): ProfessionalScenarioFeedback {
  if (task.responseType === "LONG_TEXT") return evaluateWrittenUpdate(task, response, attemptNumber);
  const correct = normalize(response) === normalize(task.correctChoiceId ?? "");
  const dimensions = Object.fromEntries(task.evaluationDimensions.map((dimension) => [
    dimension,
    dimensionFeedback(correct, "Décision cohérente avec les éléments disponibles.", "Réponse à revoir à partir des seuls faits disponibles."),
  ])) as Partial<Record<ProfessionalEvaluationDimension, ReturnType<typeof dimensionFeedback>>>;
  return { correct, message: correct ? task.successFeedback : task.retryFeedback, attemptNumber, dimensions, errorTags: correct ? [] : task.errorTags };
}

export function createProfessionalScenarioAttempt(definition: ProfessionalScenarioDefinition, at = Date.now(), id = `scenario:${definition.id}:${at}`): ProfessionalScenarioAttempt {
  return {
    id, definitionId: definition.id, definitionVersion: definition.version, status: "READY", currentTaskIndex: 0,
    completedTaskIds: [], responses: {}, attempts: {}, hintsUsed: {}, retries: {}, feedback: {}, confidence: null, assistanceUsed: {}, writingNotes: {},
    startedAt: null, completedAt: null, updatedAt: at, events: [],
  };
}

export function startProfessionalScenarioAttempt(attempt: ProfessionalScenarioAttempt, at = Date.now()) {
  if (attempt.status !== "READY") return attempt;
  return { ...attempt, status: "IN_PROGRESS" as const, startedAt: at, updatedAt: at, events: [...attempt.events, { type: "SCENARIO_STARTED" as const, at }] };
}

export function submitProfessionalScenarioTask(attempt: ProfessionalScenarioAttempt, definition: ProfessionalScenarioDefinition, response: string, at = Date.now()) {
  if (attempt.status !== "IN_PROGRESS") return attempt;
  const task = definition.tasks[attempt.currentTaskIndex];
  if (!task) return attempt;
  if (task.id === definition.communicationTask.taskId && !attempt.assistanceUsed?.[task.id]) return attempt;
  const attemptNumber = (attempt.attempts[task.id] ?? 0) + 1;
  const feedback = evaluateProfessionalTask(task, response, attemptNumber);
  return {
    ...attempt,
    responses: { ...attempt.responses, [task.id]: response },
    attempts: { ...attempt.attempts, [task.id]: attemptNumber },
    feedback: { ...attempt.feedback, [task.id]: feedback },
    updatedAt: at,
    events: [...attempt.events, { type: feedback.correct ? "RESPONSE_ACCEPTED" as const : "RESPONSE_REJECTED" as const, at, taskId: task.id, attemptNumber, ...(feedback.errorTags.length ? { errorTags: feedback.errorTags } : {}) }],
  };
}

export function retryProfessionalScenarioTask(attempt: ProfessionalScenarioAttempt, definition: ProfessionalScenarioDefinition, at = Date.now()) {
  const task = definition.tasks[attempt.currentTaskIndex];
  if (!task) return attempt;
  const feedback = { ...attempt.feedback };
  delete feedback[task.id];
  return { ...attempt, feedback, retries: { ...attempt.retries, [task.id]: (attempt.retries[task.id] ?? 0) + 1 }, updatedAt: at, events: [...attempt.events, { type: "RETRY" as const, at, taskId: task.id }] };
}

export function revealProfessionalScenarioHint(attempt: ProfessionalScenarioAttempt, definition: ProfessionalScenarioDefinition, at = Date.now()) {
  const task = definition.tasks[attempt.currentTaskIndex];
  if (!task) return attempt;
  const current = attempt.hintsUsed[task.id] ?? 0;
  const next = Math.min(3, task.hintLevels.length, current + 1);
  if (next === current) return attempt;
  return { ...attempt, hintsUsed: { ...attempt.hintsUsed, [task.id]: next }, updatedAt: at, events: [...attempt.events, { type: "HINT_USED" as const, at, taskId: task.id, attemptNumber: next }] };
}

export function setProfessionalScenarioConfidence(attempt: ProfessionalScenarioAttempt, confidence: number, at = Date.now()) {
  if (!Number.isInteger(confidence) || confidence < 1 || confidence > 5) return attempt;
  return { ...attempt, confidence, updatedAt: at };
}

export function setProfessionalScenarioAssistance(attempt: ProfessionalScenarioAttempt, taskId: string, assistance: ProfessionalAssistanceUsed, at = Date.now()) {
  return { ...attempt, assistanceUsed: { ...(attempt.assistanceUsed ?? {}), [taskId]: assistance }, updatedAt: at };
}

export function setProfessionalWritingNote(attempt: ProfessionalScenarioAttempt, taskId: string, section: ProfessionalWritingSection, value: string, at = Date.now()) {
  const empty: ProfessionalWritingNotes = { observation: "", impact: "", uncertainty: "", nextAction: "" };
  return { ...attempt, writingNotes: { ...(attempt.writingNotes ?? {}), [taskId]: { ...empty, ...(attempt.writingNotes?.[taskId] ?? {}), [section]: value } }, updatedAt: at };
}

export function organizeProfessionalWritingNotes(notes: ProfessionalWritingNotes) {
  return [
    notes.observation && `Observation : ${notes.observation.trim()}`,
    notes.impact && `Importance : ${notes.impact.trim()}`,
    notes.uncertainty && `Incertitude : ${notes.uncertainty.trim()}`,
    notes.nextAction && `Prochaine action : ${notes.nextAction.trim()}`,
  ].filter(Boolean).join("\n");
}

export function createProfessionalWritingRetestAttempt(prior: ProfessionalScenarioAttempt, definition: ProfessionalScenarioDefinition, at = Date.now()) {
  const writingIndex = definition.tasks.findIndex((task) => task.id === definition.communicationTask.taskId);
  const keptIds = definition.tasks.slice(0, writingIndex).map((task) => task.id);
  const keep = <T>(values: Record<string, T>) => Object.fromEntries(Object.entries(values).filter(([id]) => keptIds.includes(id)));
  return {
    ...createProfessionalScenarioAttempt(definition, at, `scenario:${definition.id}:writing-retest:${at}`),
    status: "IN_PROGRESS" as const,
    currentTaskIndex: writingIndex,
    completedTaskIds: keptIds,
    responses: keep(prior.responses),
    attempts: keep(prior.attempts),
    hintsUsed: keep(prior.hintsUsed),
    retries: keep(prior.retries),
    feedback: keep(prior.feedback),
    startedAt: at,
    events: [{ type: "SCENARIO_STARTED" as const, at }, { type: "TASK_VIEWED" as const, at, taskId: definition.communicationTask.taskId }],
  };
}

export function continueProfessionalScenarioAttempt(attempt: ProfessionalScenarioAttempt, definition: ProfessionalScenarioDefinition, at = Date.now()) {
  const task = definition.tasks[attempt.currentTaskIndex];
  if (!task || attempt.feedback[task.id]?.correct !== true) return attempt;
  const completedTaskIds = [...new Set([...attempt.completedTaskIds, task.id])];
  if (attempt.currentTaskIndex === definition.tasks.length - 1) {
    if (attempt.confidence === null) return attempt;
    return { ...attempt, status: "COMPLETED" as const, completedTaskIds, completedAt: at, updatedAt: at, events: [...attempt.events, { type: "SCENARIO_COMPLETED" as const, at }] };
  }
  const nextIndex = attempt.currentTaskIndex + 1;
  return { ...attempt, currentTaskIndex: nextIndex, completedTaskIds, updatedAt: at, events: [...attempt.events, { type: "TASK_VIEWED" as const, at, taskId: definition.tasks[nextIndex].id }] };
}

export function pauseProfessionalScenarioAttempt(attempt: ProfessionalScenarioAttempt, at = Date.now()) {
  if (attempt.status !== "IN_PROGRESS") return attempt;
  return { ...attempt, status: "PAUSED" as const, updatedAt: at, events: [...attempt.events, { type: "SCENARIO_PAUSED" as const, at }] };
}

export function resumeProfessionalScenarioAttempt(attempt: ProfessionalScenarioAttempt, at = Date.now()) {
  if (attempt.status !== "PAUSED") return attempt;
  return { ...attempt, status: "IN_PROGRESS" as const, updatedAt: at, events: [...attempt.events, { type: "SCENARIO_RESUMED" as const, at }] };
}

export function professionalScenarioDimensions(attempt: ProfessionalScenarioAttempt, definition: ProfessionalScenarioDefinition) {
  return Object.fromEntries(definition.evaluationPolicy.dimensions.map((dimension) => {
    const relevant = definition.tasks.filter((task) => task.evaluationDimensions.includes(dimension));
    const results = relevant.map((task) => attempt.feedback[task.id]?.dimensions[dimension]?.status);
    const status = results.some((value) => value === "INVALID") ? "INVALID" : results.length > 0 && results.every((value) => value === "VALID") ? "VALID" : "PENDING";
    return [dimension, status];
  })) as Record<ProfessionalEvaluationDimension, "PENDING" | "VALID" | "INVALID">;
}

export function professionalScenarioOutcome(attempt: ProfessionalScenarioAttempt, definition: ProfessionalScenarioDefinition) {
  const dimensions = professionalScenarioDimensions(attempt, definition);
  const completed = attempt.status === "COMPLETED" && definition.completionCriteria.requiredTaskIds.every((id) => attempt.completedTaskIds.includes(id));
  return {
    completed,
    dimensions,
    maxState: completed ? "PRACTICED" as const : attempt.events.some((event) => event.type === "RESPONSE_REJECTED") ? "FRAGILE" as const : attempt.startedAt ? "INTRODUCED" as const : "NOT_SEEN" as const,
  };
}
