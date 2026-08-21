"use client";

import { useEffect } from "react";
import { useLearningRecordStore } from "@/modules/learning-records/browser-store";
import { excelLevel1Mission } from "@/modules/mission-runtime/excel-level-1-mission";
import { useMissionRuntimeStore } from "@/modules/mission-runtime/store";

export function LearningRecordBridge() {
  const attempt = useMissionRuntimeStore((state) => state.attempts[excelLevel1Mission.id]);
  const missionHydrated = useMissionRuntimeStore((state) => state.hydrated);
  const recordsHydrated = useLearningRecordStore((state) => state.hydrated);
  const syncExcelAttempt = useLearningRecordStore((state) => state.syncExcelAttempt);
  const markMissionHydrated = useMissionRuntimeStore((state) => state.markHydrated);
  const markRecordsHydrated = useLearningRecordStore((state) => state.markHydrated);

  useEffect(() => { void Promise.resolve(useMissionRuntimeStore.persist.rehydrate()).then(markMissionHydrated); }, [markMissionHydrated]);
  useEffect(() => { void Promise.resolve(useLearningRecordStore.persist.rehydrate()).then(markRecordsHydrated); }, [markRecordsHydrated]);
  useEffect(() => {
    if (missionHydrated && recordsHydrated && attempt) syncExcelAttempt(attempt, excelLevel1Mission);
  }, [attempt, missionHydrated, recordsHydrated, syncExcelAttempt]);

  return null;
}
