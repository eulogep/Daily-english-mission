/* eslint-disable @typescript-eslint/no-require-imports -- Node strip-types test runner */
import type { ProfessionalScenarioAttempt } from "../../../src/modules/professional-scenarios/types.ts";
const assert = require("node:assert/strict");
const test = require("node:test");
const { industrialDataAnomalyScenario: definition } = require("../../../src/modules/professional-scenarios/industrial-data-anomaly-definition.ts");
const { createProfessionalScenarioAttempt, startProfessionalScenarioAttempt } = require("../../../src/modules/professional-scenarios/core.ts");
const { bootstrapProfessionalScenario, validateProfessionalScenarioAttempt } = require("../../../src/modules/professional-scenarios/startup.ts");

function harness(saved?: unknown) {
  let attempt: ProfessionalScenarioAttempt | unknown = saved;
  let recovered = 0;
  let ready = 0;
  let errors = 0;
  return {
    dependencies: {
      definition,
      hydrate: async (): Promise<void> => undefined,
      readAttempt: () => attempt,
      prepareFresh: () => { attempt = createProfessionalScenarioAttempt(definition, 10, "fresh"); },
      recoverMalformed: () => { recovered += 1; attempt = createProfessionalScenarioAttempt(definition, 11, "recovered"); },
      markReady: () => { ready += 1; },
      markRecoverableError: () => { errors += 1; },
      timeoutMs: 25,
    },
    state: () => ({ attempt, recovered, ready, errors }),
  };
}

test("B. a valid scenario session is restored exactly", async () => {
  const saved = startProfessionalScenarioAttempt(createProfessionalScenarioAttempt(definition, 1, "saved"), 2);
  const runtime = harness(saved);
  assert.equal(await bootstrapProfessionalScenario(runtime.dependencies), "READY");
  assert.equal(runtime.state().attempt, saved);
  assert.equal(runtime.state().ready, 1);
});

test("Q. malformed local state is recovered inside the scenario boundary", async () => {
  const runtime = harness({ definitionId: "wrong" });
  assert.equal(await bootstrapProfessionalScenario(runtime.dependencies), "RECOVERED");
  assert.equal(runtime.state().recovered, 1);
  assert.equal(validateProfessionalScenarioAttempt(runtime.state().attempt, definition), true);
});

test("startup timeout becomes recoverable instead of loading forever", async () => {
  const runtime = harness();
  runtime.dependencies.hydrate = () => new Promise<void>(() => undefined);
  assert.equal(await bootstrapProfessionalScenario(runtime.dependencies), "RECOVERABLE_ERROR");
  assert.equal(runtime.state().errors, 1);
});
