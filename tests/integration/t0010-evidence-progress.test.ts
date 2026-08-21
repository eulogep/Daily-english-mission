/* eslint-disable @typescript-eslint/no-require-imports -- Node strip-types test runner */
import type {} from "node:test";
const test = require("node:test");
const assert = require("node:assert/strict");
const { excelLevel1Mission } = require("../../src/modules/mission-runtime/excel-level-1-mission.ts");
const { createMissionAttempt } = require("../../src/modules/mission-runtime/attempt-state.ts");
const { reconcileExcelAttempt } = require("../../src/modules/learning-records/core.ts");

test("mission completion creates traceable evidence consumed by progress", () => {
  const base = createMissionAttempt(excelLevel1Mission, 100, "integration-attempt");
  const completed = {
    ...base,
    status: "COMPLETED",
    startedAt: 200,
    completedAt: 500,
    feedback: {
      "check-columns": { correct: true, message: "ok", attemptNumber: 1 },
      "find-anomaly": { correct: true, message: "ok", attemptNumber: 1 },
    },
  };
  const result = reconcileExcelAttempt([], completed, excelLevel1Mission);
  assert.equal(result.competency.status, "PRACTICED");
  assert.equal(result.competency.supportingEvidenceIds.length, 1);
  assert.ok(result.evidence.some((record: { id: string }) => result.competency.supportingEvidenceIds.includes(record.id)));
});
