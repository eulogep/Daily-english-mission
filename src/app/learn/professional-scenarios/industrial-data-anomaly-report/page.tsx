import type { Metadata } from "next";
import { ProfessionalScenarioRuntime } from "@/components/professional-scenarios/ProfessionalScenarioRuntime";
import { industrialDataAnomalyScenario } from "@/modules/professional-scenarios/industrial-data-anomaly-definition";

export const metadata: Metadata = { title: "Scénario professionnel · Anomalie industrielle" };

export default function IndustrialDataAnomalyScenarioPage() {
  return <ProfessionalScenarioRuntime definition={industrialDataAnomalyScenario} />;
}
