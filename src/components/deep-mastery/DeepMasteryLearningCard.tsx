import Link from "next/link";
import { ArrowRight, BrainCircuit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DeepMasteryLearningCard() {
  return <Card className="border-emerald-900/15 bg-gradient-to-br from-white to-emerald-50 shadow-sm">
    <CardHeader className="space-y-4">
      <span className="grid size-11 place-items-center rounded-xl bg-emerald-950 text-emerald-200"><BrainCircuit className="size-5" aria-hidden="true" /></span>
      <div className="space-y-2"><Badge>MAÎTRISE PROFONDE</Badge><CardTitle className="text-xl">Diagnostic CSV · Délimiteur</CardTitle><p className="text-sm font-medium text-slate-500">Comprendre · expliquer · transférer</p></div>
    </CardHeader>
    <CardContent className="space-y-5"><p className="text-sm leading-6 text-slate-600">Consolide le diagnostic d’un CSV en une colonne et termine par un cas nouveau au point-virgule.</p><Button asChild><Link href="/learn/deep-mastery-csv">Commencer<ArrowRight aria-hidden="true" /></Link></Button></CardContent>
  </Card>;
}
