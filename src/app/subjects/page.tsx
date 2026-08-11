import type { Metadata } from "next";
import { SubjectCard } from "@/components/learning-os/LearningVisuals";
export const metadata: Metadata = { title: "Matières" };
export default function SubjectsPage() {
  return <div className="space-y-7"><header className="space-y-3"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Tes matières</p><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Un domaine actif pour commencer</h1><p className="max-w-2xl leading-7 text-slate-600">D’autres domaines apparaîtront à mesure que tu avances dans des missions réelles.</p></header><SubjectCard /></div>;
}
