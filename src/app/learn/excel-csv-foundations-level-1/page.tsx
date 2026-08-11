import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock3, FileCheck2, FileSpreadsheet, ShieldCheck, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Excel CSV Foundations — Niveau 1" };

export default function ExcelMissionPage() {
  const details = [
    { label: "Objectif", value: "Séparer correctement les colonnes d’un CSV", icon: Target },
    { label: "Durée", value: "20 minutes", icon: Clock3 },
    { label: "Données", value: "TRAINING_SYNTHETIC", icon: ShieldCheck },
    { label: "Preuve future", value: "Fichier sauvegardé + explication", icon: FileCheck2 },
  ];
  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <Button asChild variant="ghost" className="-ml-3"><Link href="/"><ArrowLeft aria-hidden="true" />Aujourd’hui</Link></Button>
      <Card className="overflow-hidden border-emerald-900/15 bg-white shadow-sm">
        <div className="border-b border-emerald-900/10 bg-emerald-950 p-7 text-white sm:p-9">
          <div className="mb-5 flex flex-wrap items-center gap-2"><Badge className="bg-emerald-300 text-emerald-950 hover:bg-emerald-300"><CheckCircle2 aria-hidden="true" />READY</Badge><span className="text-sm text-emerald-100/70">Excel CSV Foundations</span></div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Niveau 1 — Import CSV</h1>
          <p className="mt-3 max-w-2xl leading-7 text-emerald-50/75">Comprendre l’import avant de nettoyer ou calculer : encodage, délimiteur et structure des colonnes.</p>
        </div>
        <CardHeader><CardTitle>Avant de commencer</CardTitle></CardHeader>
        <CardContent className="space-y-7">
          <dl className="grid gap-4 sm:grid-cols-2">
            {details.map(({ label, value, icon: Icon }) => <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"><Icon className="size-4 text-emerald-700" aria-hidden="true" />{label}</dt><dd className="mt-2 text-sm font-medium text-slate-900">{value}</dd></div>)}
          </dl>
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
            <FileSpreadsheet className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <div><p className="text-sm font-semibold">Ton parcours guidé est en préparation.</p><p className="mt-1 text-sm leading-6 text-amber-900/75">Tu peux déjà vérifier l’objectif, le temps nécessaire et la preuve attendue.</p></div>
          </div>
          <Button disabled className="w-full sm:w-auto">Bientôt disponible</Button>
        </CardContent>
      </Card>
    </div>
  );
}
