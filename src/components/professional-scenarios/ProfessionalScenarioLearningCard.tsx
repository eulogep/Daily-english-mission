import Link from "next/link";
import { ArrowRight, BriefcaseBusiness } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ProfessionalScenarioLearningCard() {
  return (
    <Card className="border-amber-900/15 bg-white shadow-sm">
      <CardHeader className="space-y-4">
        <span className="grid size-11 place-items-center rounded-xl bg-amber-100 text-amber-900"><BriefcaseBusiness className="size-5" aria-hidden="true" /></span>
        <div className="space-y-2"><Badge variant="outline">SCÉNARIO PROFESSIONNEL</Badge><CardTitle className="text-xl">Anomalie de données industrielles</CardTitle><p className="text-sm font-medium text-slate-500">Analyse · décision · compte rendu · 20 min</p></div>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm leading-6 text-slate-600">Analyse un KPI synthétique inhabituel, distingue fait et hypothèse, puis rédige une mise à jour actionnable.</p>
        <Button asChild><Link href="/learn/professional-scenarios/industrial-data-anomaly-report">Ouvrir la situation<ArrowRight aria-hidden="true" /></Link></Button>
      </CardContent>
    </Card>
  );
}
