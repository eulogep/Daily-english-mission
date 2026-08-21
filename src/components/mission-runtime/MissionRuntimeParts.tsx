import Link from "next/link";
import { CheckCircle2, Clock3, Lightbulb, Pause, RotateCcw, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { MissionDefinition, MissionFeedback } from "@/modules/mission-runtime/types";

export function MissionHeader({ mission, completed, onPause }: { mission: MissionDefinition; completed: number; onPause: () => void }) {
  const progress = Math.round((completed / mission.steps.length) * 100);
  return <header className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{mission.level}</Badge><span className="text-xs text-slate-500">≈ {mission.estimatedMinutes} min</span></div><h1 className="mt-2 text-2xl font-semibold tracking-tight">{mission.title}</h1><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">{mission.reason}</p></div><Button variant="outline" onClick={onPause}><Pause aria-hidden="true" />Pause</Button></div>
    <div><div className="mb-2 flex justify-between text-xs font-medium text-slate-500"><span>{completed} étape{completed > 1 ? "s" : ""} terminée{completed > 1 ? "s" : ""}</span><span>{progress}%</span></div><Progress value={progress} aria-label={`Progression de la mission : ${progress}%`} className="bg-emerald-100 [&_[data-slot=progress-indicator]]:bg-emerald-700" /></div>
  </header>;
}

export function MissionStepper({ mission, current, completed }: { mission: MissionDefinition; current: number; completed: string[] }) {
  return <ol aria-label="Étapes de la mission" className="flex items-center gap-2">{mission.steps.map((step, index) => {
    const done = completed.includes(step.id); const active = index === current;
    return <li key={step.id} className="flex flex-1 items-center gap-2"><span aria-current={active ? "step" : undefined} title={step.title} className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold ${done ? "bg-emerald-700 text-white" : active ? "bg-slate-950 text-white ring-4 ring-slate-200" : "bg-slate-200 text-slate-500"}`}>{done ? <CheckCircle2 className="size-4" aria-hidden="true" /> : index + 1}</span>{index < mission.steps.length - 1 && <span className={`h-0.5 flex-1 ${done ? "bg-emerald-600" : "bg-slate-200"}`} aria-hidden="true" />}</li>;
  })}</ol>;
}

export function HintPanel({ hint, level }: { hint: string; level: number }) {
  return <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950"><Lightbulb className="mt-0.5 size-5 shrink-0" aria-hidden="true" /><div><p className="text-xs font-bold uppercase tracking-wide">Indice {level}</p><p className="mt-1 text-sm leading-6">{hint}</p></div></div>;
}

export function FeedbackPanel({ feedback }: { feedback: MissionFeedback }) {
  return <div role="status" className={`rounded-xl border p-4 ${feedback.correct ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-rose-200 bg-rose-50 text-rose-950"}`}><p className="flex items-center gap-2 text-sm font-semibold">{feedback.correct ? <CheckCircle2 className="size-5" aria-hidden="true" /> : <RotateCcw className="size-5" aria-hidden="true" />}{feedback.correct ? "Bien vu" : "Essaie encore"}</p><p className="mt-1 text-sm leading-6">{feedback.message}</p></div>;
}

export function MissionCompletion({ mission, elapsedMs, timingReliable, hints, retries, onReset }: { mission: MissionDefinition; elapsedMs: number; timingReliable: boolean; hints: number; retries: number; onReset: () => void }) {
  return <Card className="mx-auto max-w-2xl border-emerald-200 bg-gradient-to-br from-white to-emerald-50 shadow-md"><CardContent className="space-y-6 p-7 text-center sm:p-10"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-700 text-white"><Sparkles aria-hidden="true" /></span><div><Badge>Mission terminée</Badge><h1 className="mt-3 text-3xl font-semibold">{mission.title} terminé.</h1><p className="mt-2 text-slate-600">Résultat et preuve enregistrés localement.</p></div>{mission.completionSummary && <ul className="mx-auto max-w-md space-y-2 text-left">{mission.completionSummary.map((item) => <li key={item} className="flex gap-2 text-sm text-slate-700"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-700" aria-hidden="true" />{item}</li>)}</ul>}<div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-950"><strong>Compétence pratiquée</strong> · pas encore retenue à long terme</div><dl className="grid grid-cols-3 gap-3"><div><dt className="text-xs text-slate-500">Temps actif</dt><dd className="mt-1 font-semibold" title={timingReliable ? undefined : "L’ancienne mesure incluait une période inactive et ne peut pas être récupérée fidèlement."}>{timingReliable ? `${Math.max(1, Math.round(elapsedMs / 60000))} min` : "Indisponible"}</dd></div><div><dt className="text-xs text-slate-500">Indices</dt><dd className="mt-1 font-semibold">{hints}</dd></div><div><dt className="text-xs text-slate-500">Nouveaux essais</dt><dd className="mt-1 font-semibold">{retries}</dd></div></dl><div className="flex flex-wrap justify-center gap-3"><Button asChild><Link href="/">Retour à Aujourd’hui</Link></Button><Button variant="outline" onClick={onReset}><RotateCcw aria-hidden="true" />Recommencer</Button></div></CardContent></Card>;
}

export function ResumePanel({ mission, paused, onAction }: { mission: MissionDefinition; paused: boolean; onAction: () => void }) {
  return <Card className="mx-auto max-w-2xl border-slate-200 bg-white shadow-md"><CardContent className="space-y-5 p-8 text-center"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-900"><Clock3 aria-hidden="true" /></span><div><Badge variant="outline">{mission.level}</Badge><h1 className="mt-3 text-2xl font-semibold">{paused ? "Ta mission est en pause" : mission.title}</h1><p className="mt-2 text-sm leading-6 text-slate-600">{paused ? "Reprends exactement là où tu t’es arrêté." : mission.reason}</p></div><Button size="lg" onClick={onAction}>{paused ? "Reprendre ma mission" : "Commencer maintenant"}</Button></CardContent></Card>;
}
