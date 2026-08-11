import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileSpreadsheet, Languages, PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Apprendre" };

export default function LearnPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Apprendre</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Des parcours courts, reliés à un objectif réel.</h1>
        <p className="max-w-2xl text-base leading-7 text-slate-600">Le catalogue reste volontairement limité. Une mission prête et le parcours historique sont disponibles.</p>
      </header>
      <Card className="border-indigo-200 bg-gradient-to-r from-indigo-950 to-slate-900 text-white shadow-md">
        <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-7">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-indigo-300 text-indigo-950"><PlayCircle aria-hidden="true" /></span>
          <div className="flex-1"><Badge className="bg-indigo-200 text-indigo-950 hover:bg-indigo-200">MISSION DÉCOUVERTE</Badge><h2 className="mt-3 text-xl font-semibold">Découvre le rythme d’une mission interactive</h2><p className="mt-1 text-sm leading-6 text-indigo-100/75">Essaie, reçois un retour, utilise un indice si nécessaire et reprends plus tard sans perdre ta place.</p></div>
          <Button asChild size="lg" className="bg-white text-indigo-950 hover:bg-indigo-50"><Link href="/learn/runtime-demo">Commencer<ArrowRight aria-hidden="true" /></Link></Button>
        </CardContent>
      </Card>
      <section aria-label="Parcours disponibles" className="grid gap-5 lg:grid-cols-2">
        <Card className="border-emerald-900/15 bg-white shadow-sm">
          <CardHeader className="space-y-4">
            <span className="grid size-11 place-items-center rounded-xl bg-emerald-100 text-emerald-900"><FileSpreadsheet className="size-5" aria-hidden="true" /></span>
            <div className="space-y-2"><Badge>READY</Badge><CardTitle className="text-xl">Excel CSV Foundations</CardTitle><p className="text-sm font-medium text-slate-500">Niveau 1 — Import CSV · 20 min</p></div>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm leading-6 text-slate-600">Prépare l’import correct d’un CSV : encodage, délimiteur et structure des colonnes.</p>
            <Button asChild><Link href="/learn/excel-csv-foundations-level-1">Voir la mission<ArrowRight aria-hidden="true" /></Link></Button>
          </CardContent>
        </Card>
        <Card className="border-slate-200/80 bg-white shadow-sm">
          <CardHeader className="space-y-4">
            <span className="grid size-11 place-items-center rounded-xl bg-slate-100 text-slate-800"><Languages className="size-5" aria-hidden="true" /></span>
            <div className="space-y-2"><Badge variant="outline">EXISTANT</Badge><CardTitle className="text-xl">Daily English Mission</CardTitle><p className="text-sm font-medium text-slate-500">Vocabulaire · expression orale · correction</p></div>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm leading-6 text-slate-600">Le parcours d’origine est préservé pendant l’évolution progressive de l’application.</p>
            <Button asChild variant="outline"><Link href="/daily-english">Continuer<ArrowRight aria-hidden="true" /></Link></Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
