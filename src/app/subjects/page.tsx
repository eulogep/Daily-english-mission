import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { academicWorkspaceRegistry } from "@/modules/academic-workspace/pilot-registry";
import { PotentialAcademicSourcesCard } from "@/components/academic-workspace/PotentialAcademicSourcesCard";
export const metadata: Metadata = { title: "Matières" };
export default function SubjectsPage() {
  return <div className="space-y-7"><header className="space-y-3"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Tes matières</p><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Espace académique multi-matière</h1><p className="max-w-2xl leading-7 text-slate-600">Une matière n’est activée que lorsque ses sources et son contenu ont été vérifiés. Les candidats d’inventaire restent explicitement planifiés.</p></header><div className="grid gap-5 md:grid-cols-2">{academicWorkspaceRegistry.subjects.map((subject) => <Card key={subject.id} className={subject.status === "ACTIVE" ? "border-emerald-300" : ""}><CardHeader><div className="flex items-center justify-between gap-3"><BookOpen className="size-5 text-emerald-700" /><Badge variant={subject.status === "ACTIVE" ? "default" : "outline"}>{subject.status === "ACTIVE" ? "Active" : "Planifiée"}</Badge></div><CardTitle>{subject.title}</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm leading-6 text-slate-600">{subject.description}</p>{subject.status === "ACTIVE" ? <Button asChild><Link href={`/subjects/${subject.slug}`}>Ouvrir la matière <ArrowRight /></Link></Button> : <p className="text-xs text-slate-500">Aucun contenu ni progression inventé.</p>}</CardContent></Card>)}</div><PotentialAcademicSourcesCard /></div>;
}
