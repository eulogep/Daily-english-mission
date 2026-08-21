"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MissionAttempt, MissionDefinition } from "@/modules/mission-runtime/types";
import { rebuildCompetencies, reconcileExcelAttempt } from "./core";
import type { CompetencyId, CompetencyRecord, EvidenceRecord, LearningRecordEvent, LearningRecordEventType } from "./types";

type LearningRecordState = {
  hydrated: boolean;
  evidence: EvidenceRecord[];
  competencies: CompetencyRecord[];
  events: LearningRecordEvent[];
  markHydrated: () => void;
  syncExcelAttempt: (attempt: MissionAttempt, mission: MissionDefinition) => void;
  removeEvidence: (evidenceId: string) => void;
  recordEvidenceViewed: (evidenceId: string) => void;
  recordCompetencyExplanationViewed: (competencyId: CompetencyId) => void;
};

function event(type: LearningRecordEventType, fields: Partial<LearningRecordEvent> = {}): LearningRecordEvent {
  const at = Date.now();
  return { id: `${type}:${at}:${globalThis.crypto.randomUUID()}`, type, at, ...fields };
}

export const useLearningRecordStore = create<LearningRecordState>()(
  persist(
    (set) => ({
      hydrated: false,
      evidence: [],
      competencies: [],
      events: [],
      markHydrated: () => set({ hydrated: true }),
      syncExcelAttempt: (attempt, mission) => set((state) => {
        const previousEvidenceIds = new Set(state.evidence.map((record) => record.id));
        const previousCompetency = state.competencies.find((record) => record.competencyId === "EXCEL_CSV_IMPORT");
        const reconciled = reconcileExcelAttempt(state.evidence, attempt, mission);
        const created = reconciled.evidence.filter((record) => !previousEvidenceIds.has(record.id));
        const evidenceChanged = JSON.stringify(reconciled.evidence) !== JSON.stringify(state.evidence);
        const competencyChanged = JSON.stringify(previousCompetency) !== JSON.stringify(reconciled.competency);
        if (!evidenceChanged && !competencyChanged) return state;
        return {
          evidence: reconciled.evidence,
          competencies: [reconciled.competency],
          events: [
            ...state.events,
            ...created.map((record) => event("EVIDENCE_CREATED", { evidenceId: record.id })),
            ...(competencyChanged ? [event("COMPETENCY_STATE_UPDATED", { competencyId: "EXCEL_CSV_IMPORT" })] : []),
          ],
        };
      }),
      removeEvidence: (evidenceId) => set((state) => {
        const evidence = state.evidence.filter((record) => record.id !== evidenceId);
        return { evidence, competencies: rebuildCompetencies(evidence) };
      }),
      recordEvidenceViewed: (evidenceId) => set((state) => ({ events: [...state.events, event("EVIDENCE_VIEWED", { evidenceId })] })),
      recordCompetencyExplanationViewed: (competencyId) => set((state) => ({ events: [...state.events, event("COMPETENCY_EXPLANATION_VIEWED", { competencyId })] })),
    }),
    {
      name: "engineer-learning-os:learning-records:v1",
      skipHydration: true,
      partialize: ({ evidence, competencies, events }) => ({ evidence, competencies, events }),
    },
  ),
);
