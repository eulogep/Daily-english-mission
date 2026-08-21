import type { Metadata } from "next";
import { MasteryLegend } from "@/components/learning-os/LearningVisuals";
import { ProgressWorkspace } from "@/components/learning-records/LearningRecordPanels";

export const metadata: Metadata = { title: "Progression" };

export default function ProgressPage() {
  return <div className="space-y-6"><ProgressWorkspace /><MasteryLegend /></div>;
}
