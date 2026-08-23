import type { ProfessionalScenarioAttempt, ProfessionalScenarioDefinition } from "./types";

type StartupDependencies = {
  definition: ProfessionalScenarioDefinition;
  hydrate: () => Promise<void> | void;
  readAttempt: () => unknown;
  prepareFresh: () => void;
  recoverMalformed: () => void;
  markReady: () => void;
  markRecoverableError: (message: string) => void;
  timeoutMs?: number;
};

const record = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

export function validateProfessionalScenarioDefinition(definition: ProfessionalScenarioDefinition) {
  try {
    const taskIds = definition.tasks.map((task) => task.id);
    return Boolean(definition.id && definition.role && definition.scenarioBrief)
      && definition.dataClassification === "TRAINING_SYNTHETIC"
      && Number.isInteger(definition.version) && definition.version > 0
      && taskIds.length > 0 && new Set(taskIds).size === taskIds.length
      && definition.completionCriteria.requiredTaskIds.every((id) => taskIds.includes(id))
      && definition.evaluationPolicy.aggregatePercentageForbidden === true;
  } catch {
    return false;
  }
}

export function validateProfessionalScenarioAttempt(value: unknown, definition: ProfessionalScenarioDefinition): value is ProfessionalScenarioAttempt {
  if (!record(value)) return false;
  const attempt = value as Partial<ProfessionalScenarioAttempt>;
  return typeof attempt.id === "string"
    && attempt.definitionId === definition.id
    && attempt.definitionVersion === definition.version
    && ["READY", "IN_PROGRESS", "PAUSED", "COMPLETED"].includes(attempt.status ?? "")
    && Number.isInteger(attempt.currentTaskIndex)
    && (attempt.currentTaskIndex ?? -1) >= 0 && (attempt.currentTaskIndex ?? definition.tasks.length) < definition.tasks.length
    && Array.isArray(attempt.completedTaskIds) && record(attempt.responses) && record(attempt.attempts)
    && record(attempt.hintsUsed) && record(attempt.retries) && record(attempt.feedback) && Array.isArray(attempt.events);
}

async function bounded(operation: () => Promise<void> | void, timeoutMs: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([Promise.resolve().then(operation), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("STARTUP_TIMEOUT")), timeoutMs); })]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function bootstrapProfessionalScenario(dependencies: StartupDependencies): Promise<"READY" | "RECOVERED" | "RECOVERABLE_ERROR"> {
  try {
    if (!validateProfessionalScenarioDefinition(dependencies.definition)) throw new Error("INVALID_DEFINITION");
    await bounded(dependencies.hydrate, dependencies.timeoutMs ?? 1500);
    const saved = dependencies.readAttempt();
    let recovered = false;
    if (saved === undefined) dependencies.prepareFresh();
    else if (!validateProfessionalScenarioAttempt(saved, dependencies.definition)) { dependencies.recoverMalformed(); recovered = true; }
    if (!validateProfessionalScenarioAttempt(dependencies.readAttempt(), dependencies.definition)) throw new Error("SESSION_RESTORE_INVALID");
    dependencies.markReady();
    return recovered ? "RECOVERED" : "READY";
  } catch (error) {
    dependencies.markRecoverableError(error instanceof Error && error.message === "STARTUP_TIMEOUT"
      ? "La reprise locale a dépassé le délai autorisé. Réessaie sans effacer tes autres données."
      : "Le scénario local n’a pas pu être restauré. Tu peux réessayer.");
    return "RECOVERABLE_ERROR";
  }
}
