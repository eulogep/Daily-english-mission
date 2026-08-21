"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowRight, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { excelLevel1Mission } from "@/modules/mission-runtime/excel-level-1-mission";
import { useMissionRuntimeStore } from "@/modules/mission-runtime/store";

export function RuntimeResumeCard() {
  const { attempts, hydrated, markHydrated } = useMissionRuntimeStore();
  useEffect(() => { void Promise.resolve(useMissionRuntimeStore.persist.rehydrate()).then(markHydrated); }, [markHydrated]);
  const attempt = attempts[excelLevel1Mission.id];
  if (!hydrated || !attempt || !["IN_PROGRESS", "PAUSED"].includes(attempt.status)) return null;
  return <Card className="border-indigo-200 bg-indigo-50 shadow-sm"><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"><span className="grid size-10 place-items-center rounded-xl bg-indigo-700 text-white"><PlayCircle aria-hidden="true" /></span><div className="flex-1"><p className="text-xs font-bold uppercase tracking-wide text-indigo-700">À reprendre</p><h2 className="mt-1 font-semibold text-slate-950">Excel CSV Foundations · étape {attempt.currentStepIndex + 1} sur {excelLevel1Mission.steps.length}</h2></div><Button asChild><Link href="/learn/excel-csv-foundations-level-1">Continuer<ArrowRight aria-hidden="true" /></Link></Button></CardContent></Card>;
}
