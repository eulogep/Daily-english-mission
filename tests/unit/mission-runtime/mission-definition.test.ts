/* eslint-disable @typescript-eslint/no-require-imports -- Node strip-types test runner */
import type {} from "node:test";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { excelLevel1Mission } = require("../../../src/modules/mission-runtime/excel-level-1-mission.ts");

test("Excel Level 1 mission exposes the approved eight-step contract", () => {
  assert.equal(excelLevel1Mission.competency, "EXCEL_CSV_IMPORT");
  assert.equal(excelLevel1Mission.estimatedMinutes, 20);
  assert.equal(excelLevel1Mission.steps.length, 8);
  assert.deepEqual(
    excelLevel1Mission.steps.map((step: { kind: string }) => step.kind),
    ["information", "resource", "information", "multiple_choice", "short_answer", "evidence_submission", "self_assessment", "information"],
  );
  assert.equal(excelLevel1Mission.completionStatus, "PRACTICED");
  assert.equal(JSON.stringify(excelLevel1Mission).includes("Level 2"), false);
});

test("published training CSV is the exact eight-row, five-column Level 1 shape", () => {
  const csvPath = path.join(process.cwd(), "public", "training-data", "excel-csv-foundations", "level-1-import.csv");
  const rows = fs.readFileSync(csvPath, "utf8").trimEnd().split(/\r?\n/).map((line: string) => line.split(","));
  assert.equal(rows.length, 9);
  assert.ok(rows.every((row: string[]) => row.length === 5));
  const missingEnergyRows = rows.slice(1).filter((row: string[]) => row[4] === "");
  assert.equal(missingEnergyRows.length, 1);
  assert.equal(missingEnergyRows[0][1], "L1-005");
});
