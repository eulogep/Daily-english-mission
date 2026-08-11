import type { MissionFeedback, MissionStepDefinition } from "./types";

export function evaluateMissionStep(step: MissionStepDefinition, response: string, attemptNumber: number): MissionFeedback {
  const normalized = response.trim().toLocaleLowerCase("fr-FR");
  let correct = false;

  if (step.kind === "multiple_choice") correct = normalized === step.correctChoiceId;
  if (step.kind === "short_answer") {
    const keywords = step.acceptedKeywords ?? [];
    correct = normalized.length >= (step.minLength ?? 1) && keywords.every((keyword) => normalized.includes(keyword));
  }
  if (step.kind === "long_text" || step.kind === "evidence_prompt") correct = normalized.length >= (step.minLength ?? 1);
  if (step.kind === "self_assessment") correct = ["1", "2", "3", "4", "5"].includes(normalized);

  return { correct, message: correct ? step.successFeedback : step.retryFeedback, attemptNumber };
}
