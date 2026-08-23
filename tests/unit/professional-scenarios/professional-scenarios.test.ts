/* eslint-disable @typescript-eslint/no-require-imports -- Node strip-types test runner */
import type { ProfessionalScenarioAttempt } from "../../../src/modules/professional-scenarios/types.ts";
const assert = require("node:assert/strict");
const test = require("node:test");
const { industrialDataAnomalyScenario: definition } = require("../../../src/modules/professional-scenarios/industrial-data-anomaly-definition.ts");
const {
  continueProfessionalScenarioAttempt,
  createProfessionalWritingRetestAttempt,
  createProfessionalScenarioAttempt,
  evaluateProfessionalTask,
  organizeProfessionalWritingNotes,
  pauseProfessionalScenarioAttempt,
  professionalScenarioOutcome,
  resumeProfessionalScenarioAttempt,
  revealProfessionalScenarioHint,
  setProfessionalScenarioAssistance,
  setProfessionalScenarioConfidence,
  startProfessionalScenarioAttempt,
  submitProfessionalScenarioTask,
} = require("../../../src/modules/professional-scenarios/core.ts");
const { professionalScenarioErrorSignals, professionalScenarioEvidenceFromAttempt } = require("../../../src/modules/professional-scenarios/integration.ts");
const { competencyIsTraceable, deriveCompetencyRecord, upsertEvidence } = require("../../../src/modules/learning-records/core.ts");
const { generateReviewItems, mergeErrorPatterns, reviewIsTraceable } = require("../../../src/modules/review-engine/core.ts");

const strongUpdate = "Le lot B-104 affiche 150 kWh/t, une énergie par tonne nettement supérieure aux autres lots présentés. Cet écart peut affecter l’interprétation du KPI, mais l’extrait ne permet pas de conclure sur sa cause. Je propose de vérifier la source, l’unité et le calcul avant le prochain point.";
const responses: Record<string, string> = {
  "identify-anomaly": "B-104",
  "separate-fact-assumption": "fact",
  "choose-next-action": "verify-source",
  "professional-update": strongUpdate,
  "self-check": "labels",
};

function answer(attempt: ProfessionalScenarioAttempt, response?: string, at = 20) {
  const task = definition.tasks[attempt.currentTaskIndex];
  if (task.id === definition.communicationTask.taskId) {
    attempt = setProfessionalScenarioAssistance(attempt, task.id, "NONE", at - 1);
  }
  let next = submitProfessionalScenarioTask(attempt, definition, response ?? responses[task.id], at);
  if (task.id === "self-check") next = setProfessionalScenarioConfidence(next, 4, at + 1);
  return continueProfessionalScenarioAttempt(next, definition, at + 2);
}

function complete(start?: ProfessionalScenarioAttempt) {
  let attempt = start ?? startProfessionalScenarioAttempt(createProfessionalScenarioAttempt(definition, 1, "professional-complete"), 2);
  while (attempt.status !== "COMPLETED") attempt = answer(attempt, undefined, attempt.updatedAt + 10);
  return attempt;
}

test("A. fresh scenario is ready without invented progress", () => {
  const attempt = createProfessionalScenarioAttempt(definition, 1, "fresh");
  assert.equal(attempt.status, "READY");
  assert.equal(attempt.startedAt, null);
  assert.deepEqual(attempt.responses, {});
});

test("C. anomaly identification accepts the synthetic outlier", () => {
  const task = definition.tasks.find((candidate: { id: string }) => candidate.id === "identify-anomaly");
  assert.equal(evaluateProfessionalTask(task, "B-104", 1).correct, true);
});

test("D. wrong anomaly identification is rejected", () => {
  const task = definition.tasks.find((candidate: { id: string }) => candidate.id === "identify-anomaly");
  const feedback = evaluateProfessionalTask(task, "B-101", 1);
  assert.equal(feedback.correct, false);
  assert.equal(feedback.errorTags.includes("MISSED_DATA_ANOMALY"), true);
});

test("E. fact and assumption are explicitly distinguished", () => {
  const task = definition.tasks.find((candidate: { id: string }) => candidate.id === "separate-fact-assumption");
  assert.equal(evaluateProfessionalTask(task, "fact", 1).correct, true);
  assert.equal(evaluateProfessionalTask(task, "failure", 1).dimensions.UNCERTAINTY_HANDLING.status, "INVALID");
});

test("F. a written overclaim is detected", () => {
  const task = definition.tasks.find((candidate: { id: string }) => candidate.id === "professional-update");
  const response = "Le lot B-104 affiche 150 kWh/t. La machine est forcément en panne et cela prouve que le site est inefficace. Il faut vérifier la source et le calcul immédiatement pour documenter cette panne certaine.";
  const feedback = evaluateProfessionalTask(task, response, 1);
  assert.equal(feedback.correct, false);
  assert.equal(feedback.errorTags.includes("OVERCLAIM_WITHOUT_EVIDENCE"), true);
});

test("G. an actionable next step is accepted", () => {
  const task = definition.tasks.find((candidate: { id: string }) => candidate.id === "choose-next-action");
  assert.equal(evaluateProfessionalTask(task, "verify-source", 1).dimensions.ACTIONABILITY.status, "VALID");
});

test("H. a weak professional update is rejected dimension by dimension", () => {
  const task = definition.tasks.find((candidate: { id: string }) => candidate.id === "professional-update");
  const feedback = evaluateProfessionalTask(task, "Il y a un problème.", 1);
  assert.equal(feedback.correct, false);
  assert.equal(feedback.dimensions.COMMUNICATION_CLARITY.status, "INVALID");
  assert.equal(feedback.dimensions.ACTIONABILITY.status, "INVALID");
});

test("I. a strong professional update is accepted without a percentage", () => {
  const task = definition.tasks.find((candidate: { id: string }) => candidate.id === "professional-update");
  const feedback = evaluateProfessionalTask(task, strongUpdate, 1);
  assert.equal(feedback.correct, true);
  assert.equal(Object.values(feedback.dimensions as Record<string, { status: string }>).every((value) => value.status === "VALID"), true);
  assert.equal(definition.evaluationPolicy.aggregatePercentageForbidden, true);
});

test("J. hint usage is capped at three and remains traceable", () => {
  let attempt = startProfessionalScenarioAttempt(createProfessionalScenarioAttempt(definition, 1, "hints"), 2);
  for (let index = 0; index < 5; index += 1) attempt = revealProfessionalScenarioHint(attempt, definition, 3 + index);
  assert.equal(attempt.hintsUsed["identify-anomaly"], 3);
  assert.equal(attempt.events.filter((event: { type: string }) => event.type === "HINT_USED").length, 3);
});

test("K. guided completion promotes at most PRACTICED", () => {
  const attempt = complete();
  assert.equal(professionalScenarioOutcome(attempt, definition).maxState, "PRACTICED");
  const evidence = professionalScenarioEvidenceFromAttempt(attempt, definition);
  assert.equal(deriveCompetencyRecord("DATA_ANOMALY_IDENTIFICATION", evidence).status, "PRACTICED");
  assert.notEqual(deriveCompetencyRecord("DATA_ANOMALY_IDENTIFICATION", evidence).status, "DEMONSTRATED");
  assert.notEqual(deriveCompetencyRecord("DATA_ANOMALY_IDENTIFICATION", evidence).status, "RETAINED");
});

test("L. meaningful errors create one traceable review item", () => {
  let attempt = startProfessionalScenarioAttempt(createProfessionalScenarioAttempt(definition, 1, "review"), 2);
  attempt = submitProfessionalScenarioTask(attempt, definition, "B-101", 3);
  const evidence = professionalScenarioEvidenceFromAttempt(attempt, definition);
  const signals = professionalScenarioErrorSignals(attempt, definition, evidence.map((record: { id: string }) => record.id));
  const patterns = mergeErrorPatterns([], signals);
  const items = generateReviewItems([], patterns, 4);
  assert.equal(patterns.length, 1);
  assert.equal(items.length, 1);
  assert.equal(reviewIsTraceable(items[0], patterns, evidence), true);
});

test("M. evidence is traceable to all professional competencies", () => {
  const evidence = professionalScenarioEvidenceFromAttempt(complete(), definition);
  for (const competencyId of definition.competencies) {
    assert.equal(competencyIsTraceable(deriveCompetencyRecord(competencyId, evidence), evidence), true);
  }
  assert.equal(evidence.at(-1).evaluationResult.dataClassification, "TRAINING_SYNTHETIC");
});

test("N. pause and resume preserve the exact workspace", () => {
  let attempt = startProfessionalScenarioAttempt(createProfessionalScenarioAttempt(definition, 1, "pause"), 2);
  attempt = submitProfessionalScenarioTask(attempt, definition, "B-104", 3);
  const paused = pauseProfessionalScenarioAttempt(attempt, 4);
  const resumed = resumeProfessionalScenarioAttempt(paused, 5);
  assert.equal(resumed.responses["identify-anomaly"], "B-104");
  assert.equal(resumed.currentTaskIndex, 0);
  assert.equal(resumed.status, "IN_PROGRESS");
});

test("O. persisted attempt survives a JSON refresh round trip", () => {
  const completed = complete();
  const restored = JSON.parse(JSON.stringify(completed));
  assert.deepEqual(restored, completed);
  assert.equal(professionalScenarioOutcome(restored, definition).maxState, "PRACTICED");
});

test("P. duplicate completion reconciliation is idempotent", () => {
  const records = professionalScenarioEvidenceFromAttempt(complete(), definition);
  const once = upsertEvidence([], records);
  const twice = upsertEvidence(once, records);
  assert.deepEqual(twice, once);
  assert.equal(twice.length, 2);
});

test("R. scenario definition has no external network dependency", () => {
  const serialized = JSON.stringify(definition);
  assert.doesNotMatch(serialized, /https?:\/\/|fetch\(|axios/i);
  assert.equal(definition.dataClassification, "TRAINING_SYNTHETIC");
});

test("S. professional writing accepts a valid alternate phrasing", () => {
  const task = definition.tasks.find((candidate: { id: string }) => candidate.id === "professional-update");
  const response = "Sur le lot 104, la consommation atteint 150 kWh par tonne, au-dessus des autres valeurs du tableau. L'origine de cet écart reste à confirmer. Avant toute conclusion, demandons une validation de l'unité puis comparons ce lot aux lots voisins.";
  const feedback = evaluateProfessionalTask(task, response, 1);
  assert.equal(feedback.correct, true);
  assert.equal(feedback.writingCriteria.OBSERVATION_PRESENT, true);
  assert.equal(feedback.writingCriteria.UNCERTAINTY_PRESENT, true);
  assert.equal(feedback.writingCriteria.NEXT_ACTION_PRESENT, true);
});

test("T. incomplete writing feedback names the missing structure", () => {
  const task = definition.tasks.find((candidate: { id: string }) => candidate.id === "professional-update");
  const feedback = evaluateProfessionalTask(task, "Le lot B-104 affiche 150 kWh/t.", 1);
  assert.equal(feedback.correct, false);
  assert.equal(feedback.missingElements.includes("ce que tu ne peux pas encore confirmer"), true);
  assert.equal(feedback.missingElements.includes("la prochaine vérification à proposer"), true);
});

test("U. writing assistance must be declared before submission", () => {
  let attempt = startProfessionalScenarioAttempt(createProfessionalScenarioAttempt(definition, 1, "disclosure"), 2);
  while (attempt.currentTaskIndex < definition.tasks.findIndex((task: { id: string }) => task.id === "professional-update")) {
    attempt = answer(attempt, undefined, attempt.updatedAt + 10);
  }
  const unchanged = submitProfessionalScenarioTask(attempt, definition, strongUpdate, attempt.updatedAt + 1);
  assert.equal(unchanged.feedback["professional-update"], undefined);
  const declared = setProfessionalScenarioAssistance(attempt, "professional-update", "NONE", attempt.updatedAt + 2);
  const submitted = submitProfessionalScenarioTask(declared, definition, strongUpdate, attempt.updatedAt + 3);
  assert.equal(submitted.feedback["professional-update"].correct, true);
});

test("V. in-app organizer preserves only learner notes", () => {
  const notes = { observation: "Lot B-104 à 150 kWh/t", impact: "KPI à interpréter prudemment", uncertainty: "cause non confirmée", nextAction: "vérifier la source" };
  const draft = organizeProfessionalWritingNotes(notes);
  assert.match(draft, /Observation : Lot B-104/);
  assert.match(draft, /Incertitude : cause non confirmée/);
  assert.match(draft, /Prochaine action : vérifier la source/);
  assert.doesNotMatch(draft, /panne|cause certaine/i);
});

test("W. external AI writing is retained but excluded from autonomous writing evidence", () => {
  let attempt = complete();
  attempt = setProfessionalScenarioAssistance(attempt, "professional-update", "EXTERNAL_AI", attempt.updatedAt + 1);
  const completion = professionalScenarioEvidenceFromAttempt(attempt, definition).at(-1);
  assert.equal(completion.evaluationResult.professionalWritingEvidence, "NOT_AUTONOMOUS_EXTERNAL_AI");
  assert.equal(completion.competencyIds.includes("PROFESSIONAL_STATUS_UPDATE"), false);
  assert.equal(completion.competencyIds.includes("DATA_ANOMALY_IDENTIFICATION"), true);
});

test("X. writing-only retest preserves the prior attempt and starts at writing", () => {
  const prior = complete();
  const snapshot = JSON.stringify(prior);
  const retest = createProfessionalWritingRetestAttempt(prior, definition, prior.updatedAt + 10);
  assert.equal(JSON.stringify(prior), snapshot);
  assert.notEqual(retest.id, prior.id);
  assert.equal(definition.tasks[retest.currentTaskIndex].id, "professional-update");
  assert.equal(retest.status, "IN_PROGRESS");
  assert.equal(retest.assistanceUsed["professional-update"], undefined);
});

test("Y. NONE is recorded as independent writing without lifting the scenario ceiling", () => {
  const attempt = complete();
  const completion = professionalScenarioEvidenceFromAttempt(attempt, definition).at(-1);
  assert.equal(completion.evaluationResult.assistanceMode, "NONE");
  assert.equal(completion.evaluationResult.professionalWritingEvidence, "INDEPENDENT");
  assert.equal(completion.evaluationResult.outcome, "SUCCESSFUL_GUIDED");
  assert.equal(professionalScenarioOutcome(attempt, definition).maxState, "PRACTICED");
  assert.equal(deriveCompetencyRecord("PROFESSIONAL_STATUS_UPDATE", [completion]).status, "PRACTICED");
});

test("Z. scaffolded writing stays guided and a later writing-only attempt is separate", () => {
  let scaffolded = complete();
  scaffolded = setProfessionalScenarioAssistance(scaffolded, "professional-update", "IN_APP_SCAFFOLD", scaffolded.updatedAt + 1);
  const scaffoldedCompletion = professionalScenarioEvidenceFromAttempt(scaffolded, definition).at(-1);
  assert.equal(scaffoldedCompletion.evaluationResult.professionalWritingEvidence, "GUIDED");

  let independent = createProfessionalWritingRetestAttempt(scaffolded, definition, scaffolded.updatedAt + 10);
  independent = answer(independent, strongUpdate, independent.updatedAt + 10);
  independent = answer(independent, "labels", independent.updatedAt + 10);
  const independentCompletion = professionalScenarioEvidenceFromAttempt(independent, definition).at(-1);
  const combined = upsertEvidence(
    professionalScenarioEvidenceFromAttempt(scaffolded, definition),
    professionalScenarioEvidenceFromAttempt(independent, definition),
  );

  assert.equal(independent.status, "COMPLETED");
  assert.equal(independentCompletion.evaluationResult.professionalWritingEvidence, "INDEPENDENT");
  assert.notEqual(independentCompletion.attemptId, scaffoldedCompletion.attemptId);
  assert.equal(combined.some((record: { id: string }) => record.id === scaffoldedCompletion.id), true);
  assert.equal(combined.some((record: { id: string }) => record.id === independentCompletion.id), true);
  assert.equal(deriveCompetencyRecord("PROFESSIONAL_STATUS_UPDATE", combined).status, "PRACTICED");
});
