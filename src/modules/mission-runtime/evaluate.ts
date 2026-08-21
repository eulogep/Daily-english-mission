import type { MissionFeedback, MissionStepDefinition } from "./types";

function normalize(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("fr-FR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ");
}

export function evaluateMissionStep(step: MissionStepDefinition, response: string, attemptNumber: number): MissionFeedback {
  const normalized = normalize(response);
  let correct = false;

  if (step.kind === "information" || step.kind === "resource") correct = normalized === "acknowledged";
  if (step.kind === "multiple_choice") correct = normalized === normalize(step.correctChoiceId ?? "");
  if (step.kind === "short_answer") {
    const keywords = step.acceptedKeywords ?? [];
    const groups = step.acceptedKeywordGroups ?? [];
    const hasKeywords = keywords.every((keyword) => normalized.includes(normalize(keyword)));
    const hasGroups = groups.every((group) => group.some((keyword) => normalized.includes(normalize(keyword))));
    correct = normalized.length >= (step.minLength ?? 1) && hasKeywords && hasGroups;
  }
  if (["long_text", "evidence_prompt", "evidence_submission"].includes(step.kind)) {
    correct = normalized.length >= (step.minLength ?? 1);
  }
  if (step.kind === "self_assessment") correct = ["1", "2", "3", "4", "5"].includes(normalized);

  return { correct, message: correct ? step.successFeedback : step.retryFeedback, attemptNumber };
}
