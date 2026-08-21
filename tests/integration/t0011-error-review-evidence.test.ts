/* eslint-disable @typescript-eslint/no-require-imports -- Node strip-types test runner */
import type {} from "node:test";
const test = require("node:test");
const assert = require("node:assert/strict");
const { excelLevel1Mission } = require("../../src/modules/mission-runtime/excel-level-1-mission.ts");
const { createMissionAttempt } = require("../../src/modules/mission-runtime/attempt-state.ts");
const { deriveCompetencyRecord, evidenceFromExcelAttempt, upsertEvidence } = require("../../src/modules/learning-records/core.ts");
const { applyReviewResult, detectExcelErrorSignals, generateReviewItems, mergeErrorPatterns, reviewEvidenceFromResult, reviewIsTraceable } = require("../../src/modules/review-engine/core.ts");

test("Excel error flows through traceable review into non-inflated competency evidence", () => {
  const base = createMissionAttempt(excelLevel1Mission, 100, "integration-review-attempt");
  const completed = {
    ...base,
    status: "COMPLETED",
    startedAt: 200,
    completedAt: 1_000,
    responses: { "check-columns": "separate-columns", "find-anomaly": "Energy_kWh manquante", "self-evaluation": "3" },
    feedback: {
      "check-columns": { correct: true, message: "ok", attemptNumber: 2 },
      "find-anomaly": { correct: true, message: "ok", attemptNumber: 1 },
    },
    events: [
      { type: "ANSWER_INCORRECT", at: 300, stepId: "check-columns", value: 1 },
      { type: "RETRY", at: 400, stepId: "check-columns" },
      { type: "MISSION_COMPLETED", at: 1_000 },
    ],
  };
  const sourceEvidence = evidenceFromExcelAttempt(completed, excelLevel1Mission);
  const signals = detectExcelErrorSignals(completed, sourceEvidence.map((record: { id: string }) => record.id));
  const patterns = mergeErrorPatterns([], signals);
  const item = generateReviewItems([], patterns, 1_100)[0];
  assert.equal(reviewIsTraceable(item, patterns, sourceEvidence), true);

  const result = {
    id: `${item.id}:attempt:1`, reviewItemId: item.id, competencyId: item.competencyId, sourceEvidenceIds: item.sourceEvidenceIds,
    correct: true, response: "delimiter", hintCount: 0, retryCount: 1, confidence: 3, durationMs: 25_000, completedAt: 2_000, sourceClassification: "PERSONAL",
  };
  const reviewed = applyReviewResult(item, patterns, result);
  const reviewEvidence = reviewEvidenceFromResult(item, result);
  const allEvidence = upsertEvidence(sourceEvidence, [reviewEvidence]);
  const competency = deriveCompetencyRecord("EXCEL_CSV_IMPORT", allEvidence);
  assert.equal(reviewed.errorPatterns[0].resolvedStatus, "IMPROVING");
  assert.deepEqual(reviewEvidence.relatedEvidenceIds, item.sourceEvidenceIds);
  assert.equal(competency.status, "PRACTICED");
});
