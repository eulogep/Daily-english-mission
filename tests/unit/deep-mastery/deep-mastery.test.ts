/* eslint-disable @typescript-eslint/no-require-imports -- Node strip-types test runner */
import type { DeepMasteryAttempt } from "../../../src/modules/deep-mastery/types.ts";
const assert = require("node:assert/strict");
const test = require("node:test");
const { csvDelimiterMastery } = require("../../../src/modules/deep-mastery/csv-delimiter-definition.ts");
const {
  continueDeepMasteryAttempt,
  createDeepMasteryAttempt,
  deepMasterySteps,
  pauseDeepMasteryAttempt,
  resumeDeepMasteryAttempt,
  retryDeepMasteryStep,
  revealDeepMasteryHint,
  startDeepMasteryAttempt,
  stepId,
  submitDeepMasteryStep,
} = require("../../../src/modules/deep-mastery/core.ts");
const { deepMasteryErrorSignals, deepMasteryEvidenceFromAttempt, deepMasteryOutcome } = require("../../../src/modules/deep-mastery/integration.ts");
const { competencyIsTraceable, deriveCompetencyRecord, upsertEvidence } = require("../../../src/modules/learning-records/core.ts");
const { generateReviewItems, mergeErrorPatterns, reviewIsTraceable } = require("../../../src/modules/review-engine/core.ts");

const correctResponses: Record<string, string> = {
  foundation: "acknowledged",
  "mental-model": "acknowledged",
  "retrieval-delimiter": "delimiter",
  "confusion-encoding": "false",
  "challenge-preview": "Je choisis le délimiteur virgule dans l’aperçu d’import Excel pour séparer les colonnes.",
  "feynman-explanation": "Le fichier reste dans une seule colonne quand Excel n’utilise pas le bon délimiteur. Je regarde le séparateur dans le fichier, puis je le choisis dans l’aperçu d’import pour répartir les champs en colonnes.",
  "held-out-semicolon": "Je vérifie le délimiteur point-virgule ; car il sépare les champs et permet de créer les colonnes.",
  "self-evaluation": "4",
};

function answerCurrent(attempt: DeepMasteryAttempt, confidence = 4, at = 10) {
  const id = stepId(deepMasterySteps(csvDelimiterMastery)[attempt.currentStepIndex]);
  const submitted = submitDeepMasteryStep(attempt, csvDelimiterMastery, correctResponses[id], confidence, at);
  assert.equal(submitted.feedback[id].correct, true, "expected " + id + " to pass");
  return continueDeepMasteryAttempt(submitted, csvDelimiterMastery, at + 1);
}

function complete(attempt = startDeepMasteryAttempt(createDeepMasteryAttempt(csvDelimiterMastery, 1, "mastery-test"), 2)) {
  let current = attempt;
  while (current.status !== "COMPLETED") current = answerCurrent(current, 4, current.updatedAt + 1);
  return current;
}

test("A. a fresh Deep Mastery session starts explicitly", () => {
  const fresh = createDeepMasteryAttempt(csvDelimiterMastery, 1, "fresh");
  assert.equal(fresh.status, "READY");
  const started = startDeepMasteryAttempt(fresh, 2);
  assert.equal(started.status, "IN_PROGRESS");
  assert.equal(started.events.at(-1)?.type, "SESSION_STARTED");
});

test("B. correct responses progress one cognitive step at a time", () => {
  let attempt = startDeepMasteryAttempt(createDeepMasteryAttempt(csvDelimiterMastery, 1, "progress"), 2);
  const before = attempt.currentStepIndex;
  attempt = answerCurrent(attempt);
  assert.equal(attempt.currentStepIndex, before + 1);
  assert.deepEqual(attempt.completedStepIds, ["foundation"]);
});

test("C. a wrong answer requires contextual retry", () => {
  let attempt = startDeepMasteryAttempt(createDeepMasteryAttempt(csvDelimiterMastery, 1, "retry"), 2);
  attempt = answerCurrent(attempt);
  attempt = answerCurrent(attempt);
  const id = stepId(deepMasterySteps(csvDelimiterMastery)[attempt.currentStepIndex]);
  attempt = submitDeepMasteryStep(attempt, csvDelimiterMastery, "encoding", 4, 20);
  assert.equal(attempt.feedback[id].correct, false);
  assert.equal(continueDeepMasteryAttempt(attempt, csvDelimiterMastery), attempt);
  attempt = retryDeepMasteryStep(attempt, csvDelimiterMastery, 21);
  assert.equal(attempt.feedback[id], undefined);
  assert.equal(attempt.retries[id], 1);
});

test("D. hint usage is capped at three and persisted in the attempt", () => {
  let attempt = startDeepMasteryAttempt(createDeepMasteryAttempt(csvDelimiterMastery, 1, "hints"), 2);
  attempt = answerCurrent(answerCurrent(attempt));
  for (let index = 0; index < 5; index += 1) attempt = revealDeepMasteryHint(attempt, csvDelimiterMastery, 10 + index);
  assert.equal(attempt.hintsUsed["retrieval-delimiter"], 3);
  assert.equal(attempt.events.filter((event) => event.type === "HINT_USED").length, 3);
});

test("E. a misconception produces a traceable deterministic signal", () => {
  let attempt = startDeepMasteryAttempt(createDeepMasteryAttempt(csvDelimiterMastery, 1, "misconception"), 2);
  attempt = answerCurrent(answerCurrent(answerCurrent(attempt)));
  attempt = submitDeepMasteryStep(attempt, csvDelimiterMastery, "true", 5, 30);
  const records = deepMasteryEvidenceFromAttempt(attempt, csvDelimiterMastery);
  const signals = deepMasteryErrorSignals(attempt, csvDelimiterMastery, records.map((record) => record.id));
  assert.equal(signals.length, 1);
  assert.equal(signals[0].concept, "CSV_DELIMITER_VS_ENCODING");
  assert.equal(signals[0].sourceEvidenceId, records[0].id);
});

test("F. the Feynman response is stored in learner evidence", () => {
  const completed = complete();
  const evidence = deepMasteryEvidenceFromAttempt(completed, csvDelimiterMastery).at(-1)!;
  assert.equal(evidence.learnerResponses["feynman-explanation"], correctResponses["feynman-explanation"]);
  assert.equal(evidence.evaluationResult.feynmanExplanation, "VALID");
});

test("G. independent held-out success can produce DEMONSTRATED", () => {
  const completed = complete();
  assert.equal(deepMasteryOutcome(completed, csvDelimiterMastery).demonstrated, true);
  const evidence = deepMasteryEvidenceFromAttempt(completed, csvDelimiterMastery);
  assert.equal(deriveCompetencyRecord("EXCEL_CSV_IMPORT", evidence).status, "DEMONSTRATED");
});

test("H. held-out success after retry remains PRACTICED", () => {
  let attempt = startDeepMasteryAttempt(createDeepMasteryAttempt(csvDelimiterMastery, 1, "assisted-transfer"), 2);
  while (stepId(deepMasterySteps(csvDelimiterMastery)[attempt.currentStepIndex]) !== "held-out-semicolon") attempt = answerCurrent(attempt);
  attempt = submitDeepMasteryStep(attempt, csvDelimiterMastery, "Je change l’encodage.", 4, 100);
  attempt = retryDeepMasteryStep(attempt, csvDelimiterMastery, 101);
  attempt = answerCurrent(attempt, 4, 102);
  attempt = answerCurrent(attempt, 4, 104);
  assert.equal(attempt.status, "COMPLETED");
  assert.equal(deepMasteryOutcome(attempt, csvDelimiterMastery).maxState, "PRACTICED");
});

test("I. an incomplete same-session attempt does not over-promote", () => {
  const started = startDeepMasteryAttempt(createDeepMasteryAttempt(csvDelimiterMastery, 1, "incomplete"), 2);
  const evidence = deepMasteryEvidenceFromAttempt(started, csvDelimiterMastery);
  assert.equal(deriveCompetencyRecord("EXCEL_CSV_IMPORT", evidence).status, "INTRODUCED");
});

test("J. DEMONSTRATED requires Feynman, transfer and limited help", () => {
  const completed = complete();
  const weakened = { ...completed, hintsUsed: { ...completed.hintsUsed, "held-out-semicolon": 2 } };
  assert.equal(deepMasteryOutcome(weakened, csvDelimiterMastery).demonstrated, false);
});

test("K. RETAINED is never awarded from the same session", () => {
  const evidence = deepMasteryEvidenceFromAttempt(complete(), csvDelimiterMastery);
  assert.notEqual(deriveCompetencyRecord("EXCEL_CSV_IMPORT", evidence).status, "RETAINED");
  assert.equal(csvDelimiterMastery.evidencePolicy.maxStateFromSingleSession, "DEMONSTRATED");
});

test("L. competency evidence remains fully traceable", () => {
  const evidence = deepMasteryEvidenceFromAttempt(complete(), csvDelimiterMastery);
  const competency = deriveCompetencyRecord("EXCEL_CSV_IMPORT", evidence);
  assert.equal(competencyIsTraceable(competency, evidence), true);
});

test("M. Error Memory merges duplicate patterns and schedules a traceable review", () => {
  let attempt = startDeepMasteryAttempt(createDeepMasteryAttempt(csvDelimiterMastery, 1, "error-memory"), 2);
  attempt = answerCurrent(answerCurrent(attempt));
  attempt = submitDeepMasteryStep(attempt, csvDelimiterMastery, "encoding", 2, 30);
  const evidence = deepMasteryEvidenceFromAttempt(attempt, csvDelimiterMastery);
  const signals = deepMasteryErrorSignals(attempt, csvDelimiterMastery, evidence.map((record) => record.id));
  const patterns = mergeErrorPatterns(mergeErrorPatterns([], signals), signals);
  const reviews = generateReviewItems([], patterns, 40);
  assert.equal(patterns.length, 1);
  assert.equal(patterns[0].occurrenceCount, 1);
  assert.equal(reviews.length, 1);
  assert.equal(reviewIsTraceable(reviews[0], patterns, evidence), true);
});

test("N. pause and resume preserve the exact step and responses", () => {
  let attempt = startDeepMasteryAttempt(createDeepMasteryAttempt(csvDelimiterMastery, 1, "pause"), 2);
  attempt = answerCurrent(attempt);
  const paused = pauseDeepMasteryAttempt(attempt, 20);
  const resumed = resumeDeepMasteryAttempt(paused, 30);
  assert.equal(resumed.currentStepIndex, attempt.currentStepIndex);
  assert.deepEqual(resumed.responses, attempt.responses);
  assert.equal(resumed.status, "IN_PROGRESS");
});

test("O. serialized local state survives a refresh round trip", () => {
  let attempt = startDeepMasteryAttempt(createDeepMasteryAttempt(csvDelimiterMastery, 1, "refresh"), 2);
  attempt = answerCurrent(answerCurrent(attempt));
  const restored = JSON.parse(JSON.stringify(attempt)) as DeepMasteryAttempt;
  assert.deepEqual(restored, attempt);
  assert.equal(stepId(deepMasterySteps(csvDelimiterMastery)[restored.currentStepIndex]), "retrieval-delimiter");
});

test("P. duplicate completion reconciliation is idempotent", () => {
  const records = deepMasteryEvidenceFromAttempt(complete(), csvDelimiterMastery);
  const once = upsertEvidence([], records);
  const twice = upsertEvidence(once, records);
  assert.deepEqual(twice, once);
  assert.equal(twice.length, 2);
});

test("Q. an autonomous second attempt strengthens evidence without erasing the assisted first attempt", () => {
  let first = startDeepMasteryAttempt(createDeepMasteryAttempt(csvDelimiterMastery, 1, "first-assisted"), 2);
  while (stepId(deepMasterySteps(csvDelimiterMastery)[first.currentStepIndex]) !== "held-out-semicolon") first = answerCurrent(first);
  first = submitDeepMasteryStep(first, csvDelimiterMastery, "Je change seulement l’encodage.", 3, 100);
  first = retryDeepMasteryStep(first, csvDelimiterMastery, 101);
  first = answerCurrent(first, 4, 102);
  first = answerCurrent(first, 4, 104);
  assert.equal(deepMasteryOutcome(first, csvDelimiterMastery).maxState, "PRACTICED");

  const second = complete(startDeepMasteryAttempt(createDeepMasteryAttempt(csvDelimiterMastery, 200, "second-autonomous"), 201));
  assert.equal(deepMasteryOutcome(second, csvDelimiterMastery).maxState, "DEMONSTRATED");

  const firstEvidence = deepMasteryEvidenceFromAttempt(first, csvDelimiterMastery);
  const allEvidence = upsertEvidence(firstEvidence, deepMasteryEvidenceFromAttempt(second, csvDelimiterMastery));
  assert.equal(allEvidence.length, 4);
  assert.equal(allEvidence.some((record: { attemptId: string }) => record.attemptId === "first-assisted"), true);
  assert.equal(allEvidence.some((record: { attemptId: string }) => record.attemptId === "second-autonomous"), true);
  assert.equal(deriveCompetencyRecord("EXCEL_CSV_IMPORT", allEvidence).status, "DEMONSTRATED");
  assert.notEqual(deriveCompetencyRecord("EXCEL_CSV_IMPORT", allEvidence).status, "RETAINED");
});

test("R. repeated real errors create one review item per concept without duplicate noise", () => {
  let attempt = startDeepMasteryAttempt(createDeepMasteryAttempt(csvDelimiterMastery, 1, "review-noise"), 2);
  attempt = answerCurrent(answerCurrent(attempt));
  for (let index = 0; index < 3; index += 1) {
    attempt = submitDeepMasteryStep(attempt, csvDelimiterMastery, "encoding", 2, 20 + index * 2);
    attempt = retryDeepMasteryStep(attempt, csvDelimiterMastery, 21 + index * 2);
  }
  const evidence = deepMasteryEvidenceFromAttempt(attempt, csvDelimiterMastery);
  const signals = deepMasteryErrorSignals(attempt, csvDelimiterMastery, evidence.map((record) => record.id));
  const patterns = mergeErrorPatterns([], signals);
  const reviews = generateReviewItems([], patterns, 50);
  const reconciledPatterns = mergeErrorPatterns(patterns, signals);
  const reconciledReviews = generateReviewItems(reviews, reconciledPatterns, 60);
  assert.equal(signals.length, 3);
  assert.equal(patterns.length, 1);
  assert.equal(patterns[0].occurrenceCount, 3);
  assert.equal(reviews.length, 1);
  assert.equal(reconciledPatterns.length, 1);
  assert.equal(reconciledReviews.length, 1);
});
