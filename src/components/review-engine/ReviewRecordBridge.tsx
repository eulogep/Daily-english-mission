"use client";

import { useEffect } from "react";
import { useLearningRecordStore } from "@/modules/learning-records/browser-store";
import { excelLevel1Mission } from "@/modules/mission-runtime/excel-level-1-mission";
import { useMissionRuntimeStore } from "@/modules/mission-runtime/store";
import { useReviewEngineStore } from "@/modules/review-engine/browser-store";

export function ReviewRecordBridge() {
  const attempt = useMissionRuntimeStore((state) => state.attempts[excelLevel1Mission.id]);
  const missionHydrated = useMissionRuntimeStore((state) => state.hydrated);
  const evidence = useLearningRecordStore((state) => state.evidence);
  const recordsHydrated = useLearningRecordStore((state) => state.hydrated);
  const reviewHydrated = useReviewEngineStore((state) => state.hydrated);
  const markHydrated = useReviewEngineStore((state) => state.markHydrated);
  const syncExcelAttempt = useReviewEngineStore((state) => state.syncExcelAttempt);

  useEffect(() => { void Promise.resolve(useReviewEngineStore.persist.rehydrate()).then(markHydrated); }, [markHydrated]);
  useEffect(() => {
    if (missionHydrated && recordsHydrated && reviewHydrated && attempt) syncExcelAttempt(attempt, evidence.map((record) => record.id));
  }, [attempt, evidence, missionHydrated, recordsHydrated, reviewHydrated, syncExcelAttempt]);
  return null;
}
