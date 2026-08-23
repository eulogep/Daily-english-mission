"use client";

import { useEffect, useMemo } from "react";
import { useLearningRecordStore } from "@/modules/learning-records/browser-store";
import { useReviewEngineStore } from "@/modules/review-engine/browser-store";
import { useAcademicWorkspaceStore } from "@/modules/academic-workspace/browser-store";
import { academicErrorSignals, academicEvidenceFromAttempt } from "@/modules/academic-workspace/integration";
import type { AcademicQuizDefinition } from "@/modules/academic-workspace/types";

export function AcademicRecordBridge({ definition }: { definition: AcademicQuizDefinition }) {
  const attempt = useAcademicWorkspaceStore((state) => state.attempts[definition.id]);
  const academicHydrated = useAcademicWorkspaceStore((state) => state.hydrated);
  const recordsHydrated = useLearningRecordStore((state) => state.hydrated);
  const reviewHydrated = useReviewEngineStore((state) => state.hydrated);
  const evidence = useLearningRecordStore((state) => state.evidence);
  const addEvidenceRecords = useLearningRecordStore((state) => state.addEvidenceRecords);
  const addErrorSignalsAndSchedule = useReviewEngineStore((state) => state.addErrorSignalsAndSchedule);
  const records = useMemo(() => attempt ? academicEvidenceFromAttempt(attempt, definition) : [], [attempt, definition]);

  useEffect(() => {
    if (academicHydrated && recordsHydrated && records.length) addEvidenceRecords(records);
  }, [academicHydrated, recordsHydrated, records, addEvidenceRecords]);

  useEffect(() => {
    if (!attempt || !academicHydrated || !recordsHydrated || !reviewHydrated) return;
    const signals = academicErrorSignals(attempt, definition, evidence.map((record) => record.id));
    if (signals.length) addErrorSignalsAndSchedule(signals);
  }, [attempt, academicHydrated, recordsHydrated, reviewHydrated, definition, evidence, addErrorSignalsAndSchedule]);

  return null;
}

