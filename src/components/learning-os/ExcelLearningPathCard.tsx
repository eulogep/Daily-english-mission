"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowRight, FileSpreadsheet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { excelLevel1Mission } from "@/modules/mission-runtime/excel-level-1-mission";
import { useMissionRuntimeStore } from "@/modules/mission-runtime/store";

export function ExcelLearningPathCard() {
  const { attempts, hydrated, markHydrated, prepare } = useMissionRuntimeStore();
  useEffect(() => { void Promise.resolve(useMissionRuntimeStore.persist.rehydrate()).then(markHydrated); }, [markHydrated]);
  useEffect(() => { if (hydrated && !attempts[excelLevel1Mission.id]) prepare(excelLevel1Mission); }, [attempts, hydrated, prepare]);
  const attempt = attempts[excelLevel1Mission.id];
  const status = hydrated ? attempt?.status ?? "READY" : "READY";
  const label = status === "COMPLETED" ? "TERMINÉ" : status === "IN_PROGRESS" || status === "PAUSED" ? "EN COURS" : "READY";
  const action = status === "COMPLETED" ? "Voir le résultat" : status === "IN_PROGRESS" || status === "PAUSED" ? "Reprendre" : "Commencer";
  return <Card className="border-emerald-900/15 bg-white shadow-sm"><CardHeader className="space-y-4"><span className="grid size-11 place-items-center rounded-xl bg-emerald-100 text-emerald-900"><FileSpreadsheet className="size-5" aria-hidden="true" /></span><div className="space-y-2"><Badge>{label}</Badge><CardTitle className="text-xl">Excel CSV Foundations</CardTitle><p className="text-sm font-medium text-slate-500">Niveau 1 — Import CSV · 20 min</p></div></CardHeader><CardContent className="space-y-5"><p className="text-sm leading-6 text-slate-600">Importe un CSV synthétique, vérifie le délimiteur et les colonnes, puis dépose une preuve locale.</p><Button asChild><Link href="/learn/excel-csv-foundations-level-1">{action}<ArrowRight aria-hidden="true" /></Link></Button></CardContent></Card>;
}
