"use client";

import { useEffect } from "react";
import { useLearningRecordStore } from "@/modules/learning-records/browser-store";
import { useReviewEngineStore } from "@/modules/review-engine/browser-store";
import { useProfessionalScenarioStore } from "@/modules/professional-scenarios/browser-store";
import { industrialDataAnomalyScenario } from "@/modules/professional-scenarios/industrial-data-anomaly-definition";
import { professionalScenarioErrorSignals, professionalScenarioEvidenceFromAttempt } from "@/modules/professional-scenarios/integration";

export function ProfessionalScenarioRecordBridge() {
  const attempt = useProfessionalScenarioStore((state) => state.attempts[industrialDataAnomalyScenario.id]);
  const startupStatus = useProfessionalScenarioStore((state) => state.startupStatus);
  const recordsHydrated = useLearningRecordStore((state) => state.hydrated);
  const evidence = useLearningRecordStore((state) => state.evidence);
  const addEvidenceRecords = useLearningRecordStore((state) => state.addEvidenceRecords);
  const reviewHydrated = useReviewEngineStore((state) => state.hydrated);
  const addErrorSignalsAndSchedule = useReviewEngineStore((state) => state.addErrorSignalsAndSchedule);

  useEffect(() => {
    if (!attempt || !recordsHydrated || !["READY", "COMPLETED"].includes(startupStatus)) return;
    const records = professionalScenarioEvidenceFromAttempt(attempt, industrialDataAnomalyScenario);
    if (records.length) addEvidenceRecords(records);
  }, [addEvidenceRecords, attempt, recordsHydrated, startupStatus]);

  useEffect(() => {
    if (!attempt || !recordsHydrated || !reviewHydrated || !["READY", "COMPLETED"].includes(startupStatus)) return;
    const signals = professionalScenarioErrorSignals(attempt, industrialDataAnomalyScenario, evidence.map((record) => record.id));
    if (signals.length) addErrorSignalsAndSchedule(signals);
  }, [addErrorSignalsAndSchedule, attempt, evidence, recordsHydrated, reviewHydrated, startupStatus]);

  return null;
}
