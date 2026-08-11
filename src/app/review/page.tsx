import type { Metadata } from "next";
import { RotateCcw } from "lucide-react";
import { DeferredWorkspace } from "@/components/learning-os/DeferredWorkspace";

export const metadata: Metadata = { title: "Réviser" };
export default function ReviewPage() {
  return <DeferredWorkspace eyebrow="À réviser" title="Aucune révision aujourd’hui" description="Tes premières révisions seront planifiées après tes missions." actionLabel="Continuer ma mission" icon={RotateCcw} />;
}
