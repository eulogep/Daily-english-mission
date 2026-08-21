import type { Metadata } from "next";
import { EvidenceWorkspace } from "@/components/learning-records/LearningRecordPanels";

export const metadata: Metadata = { title: "Preuves" };

export default function EvidencePage() {
  return <EvidenceWorkspace />;
}
