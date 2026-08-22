"use client";

import { useEffect } from "react";
import { useLearningRecordStore } from "@/modules/learning-records/browser-store";
import { useReviewEngineStore } from "@/modules/review-engine/browser-store";
import { technicalEnglishErrorSignals, technicalEnglishEvidenceFromAttempt } from "@/modules/technical-english/core";
import { useTechnicalEnglishStartupStore, useTechnicalEnglishStore } from "@/modules/technical-english/browser-store";

export function TechnicalEnglishRecordBridge() {
  const attempts = useTechnicalEnglishStore((state) => state.attempts);
  const technicalHydrated = useTechnicalEnglishStartupStore((state) => state.status === "READY");
  const recordsHydrated = useLearningRecordStore((state) => state.hydrated);
  const evidence = useLearningRecordStore((state) => state.evidence);
  const addEvidenceRecords = useLearningRecordStore((state) => state.addEvidenceRecords);
  const reviewHydrated = useReviewEngineStore((state) => state.hydrated);
  const addErrorSignals = useReviewEngineStore((state) => state.addErrorSignals);

  useEffect(() => {
    if (!technicalHydrated || !recordsHydrated) return;
    const records = Object.values(attempts).map(technicalEnglishEvidenceFromAttempt).filter((record) => record !== null);
    if (records.length) addEvidenceRecords(records);
  }, [addEvidenceRecords, attempts, recordsHydrated, technicalHydrated]);
  useEffect(() => {
    if (!technicalHydrated || !recordsHydrated || !reviewHydrated) return;
    const evidenceIds = evidence.map((record) => record.id);
    const signals = Object.values(attempts).flatMap((attempt) => technicalEnglishErrorSignals(attempt, evidenceIds));
    if (signals.length) addErrorSignals(signals);
  }, [addErrorSignals, attempts, evidence, recordsHydrated, reviewHydrated, technicalHydrated]);
  return null;
}
