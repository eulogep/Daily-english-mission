import Link from "next/link";
import { ArrowRight, BookOpenCheck, RotateCcw, Sparkles } from "lucide-react";
import { TodayMissionCard } from "@/components/learning-os/TodayMissionCard";
import { RuntimeResumeCard } from "@/components/mission-runtime/RuntimeResumeCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TodayPage() {
  const today = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  return (
    <div className="space-y-8">
      <section aria-labelledby="today-heading" className="space-y-3">
        <p className="text-sm font-medium capitalize text-slate-500">{today}</p>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Votre prochaine action</p>
        <h1 id="today-heading" className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          Avancez sur le blocage le plus important, une étape à la fois.
        </h1>
      </section>
      <TodayMissionCard />
      <RuntimeResumeCard />
      <section aria-label="Continuer et réviser" className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <Card className="border-slate-200/80 bg-white shadow-sm">
          <CardHeader className="gap-3 sm:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700"><BookOpenCheck className="size-4" aria-hidden="true" />Continuer à apprendre</p>
              <CardTitle className="text-xl">Daily English Mission</CardTitle>
              <p className="max-w-xl text-sm leading-6 text-slate-600">Le parcours historique reste disponible pendant la construction progressive d’Engineer Learning OS.</p>
            </div>
            <Button asChild variant="outline"><Link href="/daily-english">Ouvrir<ArrowRight aria-hidden="true" /></Link></Button>
          </CardHeader>
        </Card>
        <Card className="border-slate-200/80 bg-white shadow-sm">
          <CardHeader className="space-y-2">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700"><RotateCcw className="size-4" aria-hidden="true" />Révisions dues</p>
            <CardTitle className="text-xl">Aucune révision planifiée</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-6 text-slate-600">Les révisions apparaîtront ici après les premières missions évaluées. Aucun résultat n’est simulé.</p>
            <Link href="/review" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800 hover:text-emerald-700 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">Voir l’espace Réviser<ArrowRight className="size-4" aria-hidden="true" /></Link>
          </CardContent>
        </Card>
      </section>
      <Card className="overflow-hidden border-slate-200/80 bg-slate-950 text-white shadow-sm">
        <CardContent className="grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-7">
          <div className="space-y-3">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300"><Sparkles className="size-4" aria-hidden="true" />Progression</p>
            <h2 className="text-xl font-semibold">Ta progression reste reliée à des preuves réelles.</h2>
            <p className="max-w-2xl text-sm leading-6 text-slate-300">Consulte le statut de ta compétence Excel et les travaux qui le justifient, sans score artificiel.</p>
          </div>
          <Button asChild variant="secondary"><Link href="/progress">Comprendre la progression</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}
