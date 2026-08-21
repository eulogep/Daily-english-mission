"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, FileSpreadsheet, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { excelLevel1Mission } from "@/modules/mission-runtime/excel-level-1-mission";
import { useMissionRuntimeStore } from "@/modules/mission-runtime/store";

export function TodayMissionCard() {
  const { attempts, hydrated, markHydrated, prepare } = useMissionRuntimeStore();
  useEffect(() => { void Promise.resolve(useMissionRuntimeStore.persist.rehydrate()).then(markHydrated); }, [markHydrated]);
  useEffect(() => { if (hydrated && !attempts[excelLevel1Mission.id]) prepare(excelLevel1Mission); }, [attempts, hydrated, prepare]);
  const attempt = attempts[excelLevel1Mission.id];
  const status = hydrated ? attempt?.status ?? "READY" : "READY";
  const statusLabel = status === "COMPLETED" ? "TERMINÉE" : status === "IN_PROGRESS" || status === "PAUSED" ? "À REPRENDRE" : "READY";
  const detail = status === "COMPLETED" ? "Compétence pratiquée" : status === "IN_PROGRESS" || status === "PAUSED" ? `Étape ${attempt!.currentStepIndex + 1} sur ${excelLevel1Mission.steps.length}` : "Prête à démarrer";
  const action = status === "COMPLETED" ? "Voir le résultat" : status === "IN_PROGRESS" || status === "PAUSED" ? "Reprendre la mission" : "Commencer la mission";

  return (
    <article aria-labelledby="mission-title" className="relative overflow-hidden rounded-[1.75rem] border border-emerald-950/10 bg-emerald-950 px-6 py-7 text-white shadow-[0_22px_60px_-34px_rgba(6,78,59,0.75)] sm:px-8 sm:py-9">
      <div className="absolute -right-20 -top-24 size-64 rounded-full bg-emerald-400/15 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-32 left-1/3 size-72 rounded-full bg-cyan-300/10 blur-3xl" aria-hidden="true" />
      <div className="relative grid gap-8 lg:grid-cols-[1fr_17rem] lg:items-end">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2"><Badge className="border border-emerald-300/25 bg-emerald-300/15 text-emerald-100 hover:bg-emerald-300/15"><CheckCircle2 aria-hidden="true" />{statusLabel}</Badge><span className="inline-flex items-center gap-1.5 text-sm text-emerald-100/80"><Clock3 className="size-4" aria-hidden="true" />20 min</span></div>
          <div className="space-y-3"><p className="text-sm font-medium text-emerald-200">Mission du jour</p><h2 id="mission-title" className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">Excel CSV Foundations</h2><p className="text-lg font-medium text-white/90">Niveau 1 — Import CSV</p><p className="max-w-2xl text-sm leading-6 text-emerald-50/75 sm:text-base">Importer un CSV avec le bon délimiteur, vérifier ses cinq colonnes et repérer une valeur manquante.</p></div>
          <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"><Target className="mt-0.5 size-5 shrink-0 text-emerald-300" aria-hidden="true" /><div><p className="text-sm font-semibold">Pourquoi cette mission ?</p><p className="mt-1 text-sm leading-6 text-emerald-50/70">Cette mission cible ton principal blocage observé pendant la baseline : importer correctement un fichier CSV dans Excel.</p></div></div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur-sm"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-emerald-300 text-emerald-950"><FileSpreadsheet className="size-5" aria-hidden="true" /></span><div><p className="text-xs uppercase tracking-[0.15em] text-emerald-200/70">Statut</p><p className="font-semibold">{detail}</p></div></div><Button asChild size="lg" className="mt-5 w-full bg-white text-emerald-950 shadow-sm hover:bg-emerald-50"><Link href="/learn/excel-csv-foundations-level-1">{action}<ArrowRight aria-hidden="true" /></Link></Button><p className="mt-3 text-center text-xs leading-5 text-emerald-100/70">Tes réponses et ta progression restent sur cet appareil.</p></div>
      </div>
    </article>
  );
}
