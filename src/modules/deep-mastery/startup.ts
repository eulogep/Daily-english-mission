import type { DeepMasteryAttempt, DeepMasteryDefinition } from "./types";

type StartupDependencies = {
  definition: DeepMasteryDefinition;
  hydrate: () => Promise<void> | void;
  readAttempt: () => unknown;
  prepareFresh: () => void;
  recoverMalformed: () => void;
  markReady: () => void;
  markRecoverableError: (message: string) => void;
  timeoutMs?: number;
};

function validRecord(value: unknown) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function definitionStepIds(definition: DeepMasteryDefinition) {
  return [
    definition.foundation.id,
    definition.mentalModel.id,
    ...definition.questions.filter((question) => question.phase === "RETRIEVAL").map((question) => question.id),
    ...definition.confusions.map((question) => question.id),
    ...definition.questions.filter((question) => question.phase === "CHALLENGE").map((question) => question.id),
    definition.feynmanPrompt.id,
    definition.transferChallenge.id,
    "self-evaluation",
  ];
}

export function validateDeepMasteryDefinition(definition: DeepMasteryDefinition) {
  try {
    const stepIds = definitionStepIds(definition);
    return Boolean(definition.id)
      && Number.isInteger(definition.version)
      && definition.version > 0
      && definition.competencies.length > 0
      && stepIds.length >= 3
      && new Set(stepIds).size === stepIds.length;
  } catch {
    return false;
  }
}

export function validateDeepMasteryAttempt(value: unknown, definition: DeepMasteryDefinition): value is DeepMasteryAttempt {
  if (!validRecord(value)) return false;
  const attempt = value as Partial<DeepMasteryAttempt>;
  const stepIds = definitionStepIds(definition);
  return typeof attempt.id === "string"
    && attempt.definitionId === definition.id
    && attempt.definitionVersion === definition.version
    && ["READY", "IN_PROGRESS", "PAUSED", "COMPLETED"].includes(attempt.status ?? "")
    && Number.isInteger(attempt.currentStepIndex)
    && (attempt.currentStepIndex ?? -1) >= 0
    && (attempt.currentStepIndex ?? stepIds.length) < stepIds.length
    && Array.isArray(attempt.completedStepIds)
    && validRecord(attempt.responses)
    && validRecord(attempt.confidence)
    && validRecord(attempt.attempts)
    && validRecord(attempt.hintsUsed)
    && validRecord(attempt.retries)
    && validRecord(attempt.feedback)
    && Array.isArray(attempt.events);
}

async function bounded(operation: () => Promise<void> | void, timeoutMs: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      Promise.resolve().then(operation),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("STARTUP_TIMEOUT")), timeoutMs); }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function bootstrapDeepMastery(dependencies: StartupDependencies): Promise<"READY" | "RECOVERED" | "RECOVERABLE_ERROR"> {
  const timeoutMs = dependencies.timeoutMs ?? 1500;
  try {
    if (!dependencies.definition) throw new Error("DEFINITION_UNAVAILABLE");
    if (!validateDeepMasteryDefinition(dependencies.definition)) throw new Error("INVALID_DEFINITION");
    await bounded(dependencies.hydrate, timeoutMs);
    const saved = dependencies.readAttempt();
    let recovered = false;
    if (saved === undefined) dependencies.prepareFresh();
    else if (!validateDeepMasteryAttempt(saved, dependencies.definition)) {
      dependencies.recoverMalformed();
      recovered = true;
    }
    const restored = dependencies.readAttempt();
    if (!validateDeepMasteryAttempt(restored, dependencies.definition)) throw new Error("SESSION_RESTORE_INVALID");
    dependencies.markReady();
    return recovered ? "RECOVERED" : "READY";
  } catch (error) {
    const timedOut = error instanceof Error && error.message === "STARTUP_TIMEOUT";
    dependencies.markRecoverableError(timedOut
      ? "La reprise locale a dépassé le délai autorisé. Réessaie sans effacer tes autres données."
      : "La session locale n’a pas pu être restaurée. Tu peux réessayer.");
    return "RECOVERABLE_ERROR";
  }
}
