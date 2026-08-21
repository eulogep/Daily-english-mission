"use client";

import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLearningRecordStore } from "@/modules/learning-records/browser-store";
import { countDueReviews } from "@/modules/review-engine/core";
import { useReviewEngineStore } from "@/modules/review-engine/browser-store";

export function TodayReviewCard() {
  const { hydrated, reviewItems, errorPatterns } = useReviewEngineStore();
  const evidence = useLearningRecordStore((state) => state.evidence);
  const due = hydrated ? countDueReviews(reviewItems, errorPatterns, evidence, Date.now()) : 0;
  return <Card className="border-slate-200/80 bg-white shadow-sm"><CardHeader className="space-y-2"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700"><RotateCcw className="size-4" aria-hidden="true" />Révisions dues</p><CardTitle className="text-xl">{due > 0 ? `${due} révision${due > 1 ? "s" : ""} aujourd’hui` : "Aucune révision due"}</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm leading-6 text-slate-600">{due > 0 ? "Une courte récupération active est prête à partir de tes erreurs réelles." : "Les révisions apparaissent uniquement lorsqu’une preuve justifie de retravailler une notion."}</p><Button asChild variant={due > 0 ? "default" : "outline"}><Link href="/review">{due > 0 ? "Réviser maintenant" : "Voir l’espace Réviser"}<ArrowRight /></Link></Button></CardContent></Card>;
}
