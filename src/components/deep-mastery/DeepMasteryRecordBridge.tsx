"use client";

import { useEffect } from "react";
import { csvDelimiterMastery } from "@/modules/deep-mastery/csv-delimiter-definition";
import { useDeepMasteryStore } from "@/modules/deep-mastery/browser-store";
import { deepMasteryErrorSignals, deepMasteryEvidenceFromAttempt } from "@/modules/deep-mastery/integration";
import { useLearningRecordStore } from "@/modules/learning-records/browser-store";
import { useReviewEngineStore } from "@/modules/review-engine/browser-store";

export function DeepMasteryRecordBridge() {
  const attempt = useDeepMasteryStore((state) => state.attempts[csvDelimiterMastery.id]);
  const startupStatus = useDeepMasteryStore((state) => state.startupStatus);
  const recordsHydrated = useLearningRecordStore((state) => state.hydrated);
  const evidence = useLearningRecordStore((state) => state.evidence);
  const addEvidenceRecords = useLearningRecordStore((state) => state.addEvidenceRecords);
  const reviewHydrated = useReviewEngineStore((state) => state.hydrated);
  const addErrorSignalsAndSchedule = useReviewEngineStore((state) => state.addErrorSignalsAndSchedule);

  useEffect(() => {
    if (!attempt || !recordsHydrated || !["READY", "COMPLETED"].includes(startupStatus)) return;
    const records = deepMasteryEvidenceFromAttempt(attempt, csvDelimiterMastery);
    if (records.length) addEvidenceRecords(records);
  }, [addEvidenceRecords, attempt, recordsHydrated, startupStatus]);

  useEffect(() => {
    if (!attempt || !recordsHydrated || !reviewHydrated || !["READY", "COMPLETED"].includes(startupStatus)) return;
    const signals = deepMasteryErrorSignals(attempt, csvDelimiterMastery, evidence.map((record) => record.id));
    if (signals.length) addErrorSignalsAndSchedule(signals);
  }, [addErrorSignalsAndSchedule, attempt, evidence, recordsHydrated, reviewHydrated, startupStatus]);

  return null;
}
