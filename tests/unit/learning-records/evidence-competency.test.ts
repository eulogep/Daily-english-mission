/* eslint-disable @typescript-eslint/no-require-imports -- Node strip-types test runner */
import type {} from "node:test";
const test = require("node:test");
const assert = require("node:assert/strict");
const { excelLevel1Mission } = require("../../../src/modules/mission-runtime/excel-level-1-mission.ts");
const { createMissionAttempt } = require("../../../src/modules/mission-runtime/attempt-state.ts");
const { competencyIsTraceable, deriveCompetencyRecord, evidenceFromExcelAttempt, reconcileExcelAttempt, upsertEvidence } = require("../../../src/modules/learning-records/core.ts");

function startedAttempt(id = "attempt-started") {
  return { ...createMissionAttempt(excelLevel1Mission, 1_000, id), status: "IN_PROGRESS", startedAt: 1_100, activeSince: 1_100 };
}

function completedAttempt(id = "attempt-completed", completedAt = 5_000) {
  const base = startedAttempt(id);
  return {
    ...base,
    status: "COMPLETED",
    activeSince: null,
    completedAt,
    responses: {
      "check-columns": "separate-columns",
      "find-anomaly": "Energy_kWh manquante dans le lot L1-005",
      "submit-evidence": "artifact-1",
      "self-evaluation": "4",
    },
    evidence: {
      "submit-evidence": { id: `${id}-artifact`, displayName: "preuve-excel-abcd1234.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", size: 1_024, storedAt: 4_000 },
    },
    attempts: { "check-columns": 2, "find-anomaly": 2 },
    hintsUsed: { "check-columns": 1, "find-anomaly": 1 },
    feedback: {
      "check-columns": { correct: true, message: "ok", attemptNumber: 2 },
      "find-anomaly": { correct: true, message: "ok", attemptNumber: 2 },
    },
    events: [{ type: "RETRY", at: 2_000, stepId: "check-columns" }, { type: "MISSION_COMPLETED", at: completedAt }],
  };
}

test("scenario A: a fresh learner is NOT_SEEN with no orphan evidence claim", () => {
  const competency = deriveCompetencyRecord("EXCEL_CSV_IMPORT", []);
  assert.equal(competency.status, "NOT_SEEN");
  assert.deepEqual(competency.supportingEvidenceIds, []);
  assert.equal(competencyIsTraceable(competency, []), true);
});

test("scenario B: start is INTRODUCED and an unsuccessful response is FRAGILE", () => {
  const introduced = evidenceFromExcelAttempt(startedAttempt(), excelLevel1Mission);
  assert.equal(deriveCompetencyRecord("EXCEL_CSV_IMPORT", introduced).status, "INTRODUCED");
  const failed = { ...startedAttempt("attempt-failed"), feedback: { "check-columns": { correct: false, message: "retry", attemptNumber: 1 } } };
  assert.equal(deriveCompetencyRecord("EXCEL_CSV_IMPORT", evidenceFromExcelAttempt(failed, excelLevel1Mission)).status, "FRAGILE");
});

test("scenario C and G: guided completion is PRACTICED while artifact content stays UNVERIFIED", () => {
  const result = reconcileExcelAttempt([], completedAttempt(), excelLevel1Mission);
  assert.equal(result.evidence.length, 2);
  assert.equal(result.competency.status, "PRACTICED");
  assert.equal(competencyIsTraceable(result.competency, result.evidence), true);
  const completion = result.evidence.find((record: { evidenceType: string }) => record.evidenceType === "MISSION_COMPLETION");
  assert.equal(completion.verificationStatus, "VALID");
  assert.equal(completion.artifactReference.verificationStatus, "UNVERIFIED");
  assert.equal(completion.assistance.hintCount, 2);
  assert.equal(completion.assistance.retryCount, 1);
  assert.equal(completion.selfEvaluation, 4);
});

test("scenario D: repeated reconciliation is idempotent", () => {
  const attempt = completedAttempt();
  const once = reconcileExcelAttempt([], attempt, excelLevel1Mission);
  const twice = reconcileExcelAttempt(once.evidence, attempt, excelLevel1Mission);
  assert.deepEqual(twice.evidence, once.evidence);
  assert.equal(new Set(twice.evidence.map((record: { id: string }) => record.id)).size, 2);
});

test("scenario E: restarted missions receive unique identities and preserve both histories", () => {
  const first = completedAttempt("attempt-one", 5_000);
  const second = completedAttempt("attempt-two", 9_000);
  const firstRecords = evidenceFromExcelAttempt(first, excelLevel1Mission);
  const history = upsertEvidence(firstRecords, evidenceFromExcelAttempt(second, excelLevel1Mission));
  assert.notEqual(first.id, second.id);
  assert.equal(history.length, 4);
  assert.equal(new Set(history.map((record: { attemptId: string }) => record.attemptId)).size, 2);
});

test("scenario F: deleting completion evidence removes the PRACTICED claim", () => {
  const result = reconcileExcelAttempt([], completedAttempt(), excelLevel1Mission);
  const withoutCompletion = result.evidence.filter((record: { evidenceType: string }) => record.evidenceType !== "MISSION_COMPLETION");
  const rebuilt = deriveCompetencyRecord("EXCEL_CSV_IMPORT", withoutCompletion);
  assert.notEqual(rebuilt.status, "PRACTICED");
  assert.equal(competencyIsTraceable(rebuilt, withoutCompletion), true);
  assert.equal(competencyIsTraceable(result.competency, withoutCompletion), false);
});

test("one mistake cannot erase stronger historical evidence", () => {
  const completed = evidenceFromExcelAttempt(completedAttempt(), excelLevel1Mission);
  const failed = { ...startedAttempt("later-failure"), createdAt: 10_000, startedAt: 10_100, feedback: { "check-columns": { correct: false, message: "retry", attemptNumber: 1 } } };
  const combined = upsertEvidence(completed, evidenceFromExcelAttempt(failed, excelLevel1Mission));
  assert.equal(deriveCompetencyRecord("EXCEL_CSV_IMPORT", combined).status, "PRACTICED");
});

test("createMissionAttempt produces a new identity for a real restart", () => {
  const first = createMissionAttempt(excelLevel1Mission, 1_000);
  const restarted = createMissionAttempt(excelLevel1Mission, 1_000);
  assert.notEqual(first.id, restarted.id);
});
