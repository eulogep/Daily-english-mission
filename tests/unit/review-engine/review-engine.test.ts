/* eslint-disable @typescript-eslint/no-require-imports -- Node strip-types test runner */
import type {} from "node:test";
const test = require("node:test");
const assert = require("node:assert/strict");
const { excelLevel1Mission } = require("../../../src/modules/mission-runtime/excel-level-1-mission.ts");
const { createMissionAttempt } = require("../../../src/modules/mission-runtime/attempt-state.ts");
const {
  DAY_MS,
  MINUTE_MS,
  applyReviewResult,
  countDueReviews,
  detectExcelErrorSignals,
  evaluateReviewResponse,
  generateReviewItems,
  mergeErrorPatterns,
  reviewIsTraceable,
} = require("../../../src/modules/review-engine/core.ts");

function attempt(id: string, events: Array<{ type: string; at: number; stepId?: string; value?: number }> = [], confidence?: string) {
  return {
    ...createMissionAttempt(excelLevel1Mission, 100, id),
    status: "IN_PROGRESS",
    startedAt: 200,
    activeSince: 200,
    events,
    responses: confidence ? { "self-evaluation": confidence } : {},
  };
}

function evidenceFor(attemptId: string) {
  return {
    id: `${attemptId}:MISSION_ATTEMPT`,
    attemptId,
    missionId: excelLevel1Mission.id,
    missionVersion: 1,
    competencyIds: ["EXCEL_CSV_IMPORT"],
    createdAt: 200,
    evidenceType: "MISSION_ATTEMPT",
    artifactReference: null,
    learnerResponses: {},
    evaluationResult: { outcome: "ENCOUNTERED", delimiterDiagnostic: "PENDING", anomalyIdentification: "PENDING", missionCompletion: "PENDING" },
    assistance: { hintCount: 0, retryCount: 0 },
    selfEvaluation: null,
    sourceClassification: "PERSONAL",
    verificationStatus: "VALID",
  };
}

function wrongDelimiter(id = "attempt-one") {
  return attempt(id, [{ type: "ANSWER_INCORRECT", at: 300, stepId: "check-columns", value: 1 }]);
}

function result(item: { id: string; competencyId: string; sourceEvidenceIds: string[] }, correct: boolean, completedAt: number, attemptNumber: number) {
  return {
    id: `${item.id}:attempt:${attemptNumber}`,
    reviewItemId: item.id,
    competencyId: item.competencyId,
    sourceEvidenceIds: item.sourceEvidenceIds,
    correct,
    response: correct ? "delimiter" : "font",
    hintCount: 0,
    retryCount: correct ? 1 : 0,
    confidence: correct ? 3 : null,
    durationMs: 30_000,
    completedAt,
    sourceClassification: "PERSONAL",
  };
}

test("scenario A: no meaningful error evidence creates no review", () => {
  const clean = attempt("clean-attempt");
  const evidence = evidenceFor(clean.id);
  const signals = detectExcelErrorSignals(clean, [evidence.id]);
  assert.deepEqual(signals, []);
  assert.deepEqual(generateReviewItems([], mergeErrorPatterns([], signals), 1_000), []);
});

test("scenario B: a meaningful delimiter mistake creates one error pattern", () => {
  const current = wrongDelimiter();
  const signals = detectExcelErrorSignals(current, [`${current.id}:MISSION_ATTEMPT`]);
  const patterns = mergeErrorPatterns([], signals);
  assert.equal(patterns.length, 1);
  assert.equal(patterns[0].errorType, "PROCEDURAL_ERROR");
  assert.equal(patterns[0].concept, "CSV_DELIMITER_DIAGNOSIS");
});

test("scenario C: the same error on a later attempt increments occurrence without duplicate", () => {
  const first = wrongDelimiter("attempt-one");
  const later = wrongDelimiter("attempt-two");
  const firstPatterns = mergeErrorPatterns([], detectExcelErrorSignals(first, [`${first.id}:MISSION_ATTEMPT`]));
  const patterns = mergeErrorPatterns(firstPatterns, detectExcelErrorSignals(later, [`${later.id}:MISSION_ATTEMPT`]));
  assert.equal(patterns.length, 1);
  assert.equal(patterns[0].occurrenceCount, 2);
  assert.deepEqual(patterns[0].attemptIds, ["attempt-one", "attempt-two"]);
});

test("scenarios D and E: eligible pattern creates one idempotent review item", () => {
  const current = wrongDelimiter();
  const patterns = mergeErrorPatterns([], detectExcelErrorSignals(current, [`${current.id}:MISSION_ATTEMPT`]));
  const once = generateReviewItems([], patterns, 1_000);
  const twice = generateReviewItems(once, patterns, 2_000);
  assert.equal(once.length, 1);
  assert.deepEqual(twice, once);
  assert.equal(once[0].status, "DUE");
});

test("scenario F: successful review schedules three days later and marks pattern improving", () => {
  const current = wrongDelimiter();
  const patterns = mergeErrorPatterns([], detectExcelErrorSignals(current, [`${current.id}:MISSION_ATTEMPT`]));
  const item = generateReviewItems([], patterns, 1_000)[0];
  const completedAt = 2_000;
  const updated = applyReviewResult(item, patterns, result(item, true, completedAt, 1));
  assert.equal(updated.reviewItem.nextReviewAt, completedAt + 3 * DAY_MS);
  assert.equal(updated.errorPatterns[0].resolvedStatus, "IMPROVING");
});

test("scenario G: failed review is scheduled ten minutes sooner", () => {
  const current = wrongDelimiter();
  const patterns = mergeErrorPatterns([], detectExcelErrorSignals(current, [`${current.id}:MISSION_ATTEMPT`]));
  const item = generateReviewItems([], patterns, 1_000)[0];
  const completedAt = 2_000;
  const updated = applyReviewResult(item, patterns, result(item, false, completedAt, 1));
  assert.equal(updated.reviewItem.nextReviewAt, completedAt + 10 * MINUTE_MS);
  assert.equal(updated.errorPatterns[0].resolvedStatus, "ACTIVE");
});

test("scenario H: three delayed successes make the pattern eligible for resolved", () => {
  const current = wrongDelimiter();
  let patterns = mergeErrorPatterns([], detectExcelErrorSignals(current, [`${current.id}:MISSION_ATTEMPT`]));
  let item = generateReviewItems([], patterns, 1_000)[0];
  for (let index = 1; index <= 3; index += 1) {
    const completedAt = item.dueAt + 1_000;
    const updated = applyReviewResult(item, patterns, result(item, true, completedAt, index));
    item = updated.reviewItem;
    patterns = updated.errorPatterns;
  }
  assert.equal(patterns[0].metadata.successfulReviewCount, 3);
  assert.equal(patterns[0].resolvedStatus, "RESOLVED");
  assert.equal(item.intervalMinutes, 14 * 24 * 60);
});

test("scenario I: review with missing source evidence is rejected as orphan", () => {
  const current = wrongDelimiter();
  const evidence = evidenceFor(current.id);
  const patterns = mergeErrorPatterns([], detectExcelErrorSignals(current, [evidence.id]));
  const item = generateReviewItems([], patterns, 1_000)[0];
  assert.equal(reviewIsTraceable(item, patterns, []), false);
  assert.equal(reviewIsTraceable(item, patterns, [evidence]), true);
});

test("scenario J: Today count includes only traceable items that are actually due", () => {
  const current = wrongDelimiter();
  const evidence = evidenceFor(current.id);
  const patterns = mergeErrorPatterns([], detectExcelErrorSignals(current, [evidence.id]));
  const due = generateReviewItems([], patterns, 1_000);
  const upcoming = [{ ...due[0], id: `${due[0].id}:future`, dueAt: 10_000, nextReviewAt: 10_000 }];
  assert.equal(countDueReviews([...due, ...upcoming], patterns, [evidence], 2_000), 1);
  assert.equal(countDueReviews(due, patterns, [], 2_000), 0);
});

test("retrieval evaluator requires a real response before feedback", () => {
  const current = wrongDelimiter();
  const patterns = mergeErrorPatterns([], detectExcelErrorSignals(current, [`${current.id}:MISSION_ATTEMPT`]));
  const item = generateReviewItems([], patterns, 1_000)[0];
  assert.equal(evaluateReviewResponse(item, ""), false);
  assert.equal(evaluateReviewResponse(item, "font"), false);
  assert.equal(evaluateReviewResponse(item, "delimiter"), true);
});
