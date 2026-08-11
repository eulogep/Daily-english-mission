import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";
import { DeferredWorkspace } from "@/components/learning-os/DeferredWorkspace";
import { MasteryLegend } from "@/components/learning-os/LearningVisuals";

export const metadata: Metadata = { title: "Progression" };
export default function ProgressPage() {
  return <div className="space-y-6"><DeferredWorkspace eyebrow="Ta progression" title="Ta progression commencera avec ta première preuve" description="Chaque étape maîtrisée sera liée à un travail réel, pour que tu voies clairement ce qui devient solide." actionLabel="Commencer ma mission" icon={BarChart3} /><MasteryLegend /></div>;
}
