"use client";

import Link from "next/link";
import { ArrowRight, Languages } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTechnicalEnglishStore } from "@/modules/technical-english/browser-store";

export function TechnicalEnglishLearningCard() {
  const currentId = useTechnicalEnglishStore((state) => state.currentAttemptId);
  const attempt = useTechnicalEnglishStore((state) => currentId ? state.attempts[currentId] : null);
  const completed = attempt?.status === "COMPLETED";
  return <Card className="border-cyan-900/15 bg-white shadow-sm"><CardHeader className="space-y-4"><span className="grid size-11 place-items-center rounded-xl bg-cyan-100 text-cyan-900"><Languages className="size-5" /></span><div className="space-y-2"><Badge variant={completed ? "default" : "outline"}>{completed ? "TERMINÉ" : attempt ? "EN COURS" : "NOUVEAU"}</Badge><CardTitle className="text-xl">Technical English</CardTitle><p className="text-sm font-medium text-slate-500">CSV troubleshooting · 5–10 min</p></div></CardHeader><CardContent className="space-y-5"><p className="text-sm leading-6 text-slate-600">Explique en anglais comment diagnostiquer un CSV ouvert dans une seule colonne. Audio local ou texte de remplacement.</p><Button asChild><Link href="/learn/technical-english">{completed ? "Voir ma tentative" : attempt ? "Reprendre" : "Commencer"}<ArrowRight /></Link></Button></CardContent></Card>;
}
