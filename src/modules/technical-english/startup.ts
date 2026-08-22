import type { TechnicalEnglishAttempt } from "./types";

export type TechnicalEnglishHydrationStatus = "NOT_STARTED" | "LOADING" | "READY" | "RECOVERABLE_ERROR";
export type HydrationFailureCode = "TIMEOUT" | "STORAGE_ERROR" | "INVALID_STATE";
export type TechnicalEnglishInitializer = () => void | Promise<void>;

export async function invokeTechnicalEnglishBootstrap(initialize: TechnicalEnglishInitializer) {
  await initialize();
}

export class TechnicalEnglishHydrationError extends Error {
  readonly code: HydrationFailureCode;

  constructor(code: HydrationFailureCode, message: string) {
    super(message);
    this.name = "TechnicalEnglishHydrationError";
    this.code = code;
  }
}

export async function hydrateWithWatchdog(
  rehydrate: () => void | Promise<void>,
  timeoutMs: number,
): Promise<void> {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  const watchdog = new Promise<never>((_, reject) => {
    timeout = setTimeout(
      () => reject(new TechnicalEnglishHydrationError("TIMEOUT", "Le stockage local ne répond pas.")),
      timeoutMs,
    );
  });
  try {
    await Promise.race([
      Promise.resolve().then(rehydrate).catch((error) => {
        throw new TechnicalEnglishHydrationError(
          "STORAGE_ERROR",
          error instanceof Error ? error.message : "La lecture du stockage local a échoué.",
        );
      }),
      watchdog,
    ]);
  } finally {
    if (timeout !== null) clearTimeout(timeout);
  }
}

function isAttempt(value: unknown): value is TechnicalEnglishAttempt {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<TechnicalEnglishAttempt>;
  return typeof candidate.id === "string"
    && candidate.missionId === "technical-english-csv-explanation-v1"
    && typeof candidate.createdAt === "number"
    && Array.isArray(candidate.events);
}

export function validateHydratedTechnicalEnglishState(
  attempts: unknown,
  currentAttemptId: unknown,
): asserts attempts is Record<string, TechnicalEnglishAttempt> {
  if (!attempts || typeof attempts !== "object" || Array.isArray(attempts)) {
    throw new TechnicalEnglishHydrationError("INVALID_STATE", "Le format des tentatives locales est invalide.");
  }
  if (currentAttemptId !== null && typeof currentAttemptId !== "string") {
    throw new TechnicalEnglishHydrationError("INVALID_STATE", "La tentative active locale est invalide.");
  }
  if (!Object.values(attempts).every(isAttempt)) {
    throw new TechnicalEnglishHydrationError("INVALID_STATE", "Une tentative locale est incomplète ou incompatible.");
  }
}

export function hydrationErrorMessage(error: unknown) {
  if (error instanceof TechnicalEnglishHydrationError && error.code === "TIMEOUT") {
    return "Le stockage local met trop de temps à répondre. Tes données n’ont pas été effacées.";
  }
  if (error instanceof TechnicalEnglishHydrationError && error.code === "INVALID_STATE") {
    return "Ton état local ne peut pas être chargé en sécurité. Tes données existantes n’ont pas été effacées.";
  }
  return "Impossible de charger ton état local. Tes données existantes n’ont pas été effacées.";
}
