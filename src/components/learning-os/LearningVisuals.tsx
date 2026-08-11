import Link from "next/link";
import { ArrowRight, FileSpreadsheet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function SubjectCard() {
  return <Card className="border-emerald-900/15 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"><CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center"><span className="grid size-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-900"><FileSpreadsheet aria-hidden="true" /></span><div className="flex-1"><div className="flex gap-2"><Badge>À commencer</Badge><Badge variant="outline">Données</Badge></div><h2 className="mt-3 text-xl font-semibold">Excel CSV Foundations</h2><p className="mt-1 text-sm text-slate-600">Prochaine mission : importer correctement un fichier CSV.</p></div><Button asChild variant="outline"><Link href="/learn/excel-csv-foundations-level-1">Voir<ArrowRight aria-hidden="true" /></Link></Button></CardContent></Card>;
}

const levels = ["À découvrir", "Découverte", "Fragile", "Pratiquée", "Démontrée", "Retenue"];
export function MasteryLegend() {
  return <section aria-labelledby="mastery-title" className="rounded-2xl border border-slate-200 bg-white p-6"><h2 id="mastery-title" className="text-lg font-semibold">Comment lire ta maîtrise</h2><p className="mt-1 text-sm text-slate-600">Ces repères seront attribués uniquement à partir de tes futures preuves.</p><ul className="mt-5 grid gap-2 sm:grid-cols-3">{levels.map((level,index)=><li key={level} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium"><span className={`size-2.5 rounded-full ${index < 2 ? "bg-slate-300" : index < 4 ? "bg-amber-400" : "bg-emerald-500"}`} aria-hidden="true" />{level}</li>)}</ul></section>;
}
