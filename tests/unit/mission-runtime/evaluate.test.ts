/* eslint-disable @typescript-eslint/no-require-imports -- Node strip-types test runner */
import type {} from "node:test";
const test = require("node:test");
const assert = require("node:assert/strict");
const { evaluateMissionStep } = require("../../../src/modules/mission-runtime/evaluate.ts");
const { excelLevel1Mission } = require("../../../src/modules/mission-runtime/excel-level-1-mission.ts");

const columnsStep = excelLevel1Mission.steps.find((step: { id: string }) => step.id === "check-columns");
const anomalyStep = excelLevel1Mission.steps.find((step: { id: string }) => step.id === "find-anomaly");

test("delimiter diagnostic rejects one-column data and accepts five columns", () => {
  assert.equal(evaluateMissionStep(columnsStep, "single-column", 1).correct, false);
  assert.equal(evaluateMissionStep(columnsStep, "separate-columns", 2).correct, true);
});

test("anomaly evaluator accepts reasonable French variants without exact punctuation", () => {
  assert.equal(evaluateMissionStep(anomalyStep, "La valeur Energy_kWh est manquante pour L1-005", 1).correct, true);
  assert.equal(evaluateMissionStep(anomalyStep, "Il y a une énergie absente dans une ligne", 1).correct, true);
  assert.equal(evaluateMissionStep(anomalyStep, "La date semble étrange", 1).correct, false);
});

test("information steps require an explicit acknowledgement", () => {
  const step = excelLevel1Mission.steps[0];
  assert.equal(evaluateMissionStep(step, "", 1).correct, false);
  assert.equal(evaluateMissionStep(step, "acknowledged", 1).correct, true);
});
