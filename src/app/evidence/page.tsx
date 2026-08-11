import type { Metadata } from "next";
import { FileCheck2 } from "lucide-react";
import { DeferredWorkspace } from "@/components/learning-os/DeferredWorkspace";

export const metadata: Metadata = { title: "Preuves" };
export default function EvidencePage() {
  return <DeferredWorkspace eyebrow="Tes preuves" title="Aucune preuve pour le moment" description="Tes fichiers, réponses et productions apparaîtront ici après tes premières missions." actionLabel="Voir ma mission" icon={FileCheck2} />;
}
