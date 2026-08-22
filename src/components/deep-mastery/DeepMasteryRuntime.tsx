"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowRight, BrainCircuit, CheckCircle2, HelpCircle, Pause, RotateCcw, Send, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { hydrateDeepMasteryStore, useDeepMasteryStore } from "@/modules/deep-mastery/browser-store";
import { createDeepMasteryAttempt, deepMasterySteps, stepId, stepPhase } from "@/modules/deep-mastery/core";
import { deepMasteryOutcome } from "@/modules/deep-mastery/integration";
import type { DeepMasteryDefinition } from "@/modules/deep-mastery/types";
import { DeepMasteryRecordBridge } from "./DeepMasteryRecordBridge";

const phaseLabels = { FOUNDATION: "Fondation", MENTAL_MODEL: "Modèle mental", RETRIEVAL: "Récupération", CONFUSIONS: "Confusions", CHALLENGE: "Défi", FEYNMAN: "Explication", TRANSFER: "Transfert", SELF_EVALUATION: "Auto-évaluation", COMPLETION: "Terminé" } as const;

export function DeepMasteryRuntime({ definition }: { definition: DeepMasteryDefinition }) {
  const state = useDeepMasteryStore();
  const attempt = state.attempts[definition.id] ?? createDeepMasteryAttempt(definition);
  const steps = deepMasterySteps(definition);
  const step = steps[attempt.currentStepIndex];
  const id = stepId(step);
  const draft = state.drafts[definition.id] ?? "";
  const confidence = state.confidenceDrafts[definition.id] ?? 0;
  const feedback = attempt.feedback[id];

  useEffect(() => {
    void hydrateDeepMasteryStore(definition);
  }, [definition]);

  if (state.startupStatus === "LOADING") return <Card><CardContent className="grid min-h-64 place-items-center p-8 text-center"><div><BrainCircuit className="mx-auto size-10 animate-pulse text-emerald-700" /><p className="mt-4 font-semibold">Préparation de ta session locale…</p></div></CardContent></Card>;
  if (state.startupStatus === "RECOVERABLE_ERROR") return <Card className="border-amber-300"><CardContent className="p-8 text-center"><h1 className="text-xl font-semibold">La reprise locale n’a pas abouti</h1><p className="mt-3 text-sm text-slate-600">{state.startupError}</p><Button className="mt-5" onClick={() => void hydrateDeepMasteryStore(definition)}><RotateCcw />Réessayer</Button></CardContent></Card>;
  if (attempt.status === "READY") return <Card className="mx-auto max-w-3xl border-emerald-900/15 shadow-md"><CardContent className="space-y-6 p-7 sm:p-9"><Badge>25 MIN · LOCAL</Badge><div><h1 className="text-3xl font-semibold tracking-tight">{definition.title}</h1><p className="mt-3 leading-7 text-slate-600">Comprends le concept, récupère-le sans support, explique-le puis applique-le à un cas nouveau.</p></div><ul className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2"><li>✓ Une tâche à la fois</li><li>✓ Trois niveaux d’indice maximum</li><li>✓ Erreurs reliées aux révisions</li><li>✓ État fondé sur tes preuves</li></ul><Button size="lg" onClick={() => state.start(definition)}>Démarrer la session<ArrowRight /></Button></CardContent></Card>;
  if (attempt.status === "PAUSED") return <Card className="mx-auto max-w-2xl"><CardContent className="p-8 text-center"><Pause className="mx-auto size-9 text-emerald-700" /><h1 className="mt-4 text-2xl font-semibold">Session en pause</h1><p className="mt-2 text-slate-600">Ton étape, tes réponses et tes indices sont enregistrés localement.</p><div className="mt-6 flex justify-center gap-3"><Button onClick={() => state.resume(definition)}>Reprendre</Button><Button asChild variant="outline"><Link href="/learn">Retour à Apprendre</Link></Button></div></CardContent></Card>;
  if (attempt.status === "COMPLETED") {
    const outcome = deepMasteryOutcome(attempt, definition);
    const hints = Object.values(attempt.hintsUsed).reduce((sum, value) => sum + value, 0);
    const retries = Object.values(attempt.retries).reduce((sum, value) => sum + value, 0);
    return <><DeepMasteryRecordBridge /><Card className="mx-auto max-w-3xl border-emerald-300 bg-emerald-50/50"><CardContent className="space-y-6 p-8"><CheckCircle2 className="size-12 text-emerald-700" /><div><Badge>{outcome.maxState}</Badge><h1 className="mt-3 text-3xl font-semibold">Session terminée</h1><p className="mt-3 leading-7 text-slate-700">{outcome.demonstrated ? "Tu as expliqué la notion et réussi un cas nouveau avec une aide limitée. La compétence peut être marquée Démontrée." : "Tu as terminé le parcours guidé. La compétence reste Pratiquée car le transfert a demandé davantage d’aide."}</p></div><div className="grid gap-3 sm:grid-cols-3"><Summary label="Explication" value={outcome.feynmanSuccessful ? "Validée" : "À renforcer"} /><Summary label="Transfert" value={outcome.transferSuccessful ? "Réussi" : "À renforcer"} /><Summary label="Aide" value={hints + " indice(s) · " + retries + (retries > 1 ? " nouvelles tentatives" : " nouvelle tentative")} /></div><p className="flex gap-2 rounded-xl bg-white p-4 text-sm text-slate-700"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-700" />RETAINED n’est jamais attribué dans la même session; une récupération réussie après délai reste nécessaire.</p><div className="flex flex-wrap gap-3"><Button asChild><Link href="/evidence">Voir pourquoi cet état</Link></Button><Button variant="outline" onClick={() => state.restart(definition)}><RotateCcw />Nouvelle tentative</Button></div></CardContent></Card></>;
  }

  const phase = stepPhase(step);
  const hintCount = attempt.hintsUsed[id] ?? 0;
  const availableHints = step.kind === "QUESTION" ? step.question.hintLevels : [];
  const needsConfidence = step.kind !== "CONTENT";
  const canSubmit = step.kind === "CONTENT" || (draft.trim().length > 0 && (!needsConfidence || confidence > 0));
  return <><DeepMasteryRecordBridge /><div className="mx-auto max-w-4xl space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">{phaseLabels[phase]}</p><h1 className="mt-1 text-2xl font-semibold">{definition.title}</h1></div><Button variant="outline" onClick={() => state.pause(definition)}><Pause />Pause</Button></div>
    <div aria-label={"Progression " + (attempt.currentStepIndex + 1) + " sur " + steps.length}><div className="mb-2 flex justify-between text-xs font-medium text-slate-500"><span>Étape {attempt.currentStepIndex + 1} sur {steps.length}</span><span>{Math.round((attempt.completedStepIds.length / steps.length) * 100)} %</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-emerald-700 transition-all" style={{ width: (attempt.completedStepIds.length / steps.length) * 100 + "%" }} /></div></div>
    <Card className="border-slate-200 bg-white shadow-md"><CardContent className="space-y-6 p-6 sm:p-8">
      {step.kind === "CONTENT" ? <><div><h2 className="text-2xl font-semibold">{step.content.title}</h2><p className="mt-3 leading-7 text-slate-700">{step.content.instruction}</p></div><ul className="space-y-3 rounded-xl bg-slate-50 p-5 text-sm leading-6 text-slate-700">{step.content.keyPoints.map((point) => <li key={point} className="flex gap-3"><span className="font-bold text-emerald-700">→</span>{point}</li>)}</ul>{step.content.why && <details className="rounded-xl border border-slate-200 p-4 text-sm"><summary className="cursor-pointer font-semibold">Pourquoi ?</summary><p className="mt-2 leading-6 text-slate-600">{step.content.why}</p></details>}</> : step.kind === "SELF_EVALUATION" ? <div><h2 className="text-2xl font-semibold">{step.title}</h2><p className="mt-3 text-slate-700">{step.instruction}</p></div> : <><div><div className="flex flex-wrap items-center gap-2"><Badge variant="outline">NIVEAU {step.question.difficulty}</Badge>{step.question.phase === "TRANSFER" && <Badge>CAS NOUVEAU</Badge>}</div><h2 className="mt-3 text-2xl font-semibold">{step.question.title}</h2><p className="mt-3 leading-7 text-slate-700">{step.question.instruction}</p></div>{step.question.why && <details className="rounded-xl border border-slate-200 p-4 text-sm"><summary className="cursor-pointer font-semibold">Pourquoi ?</summary><p className="mt-2 text-slate-600">{step.question.why}</p></details>}</>}
      {step.kind === "QUESTION" && step.question.type === "MULTIPLE_CHOICE" && <RadioGroup value={draft} onValueChange={(value) => state.setDraft(definition.id, value)} disabled={Boolean(feedback)}>{step.question.choices?.map((choice) => <label key={choice.id} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 hover:border-emerald-400"><RadioGroupItem value={choice.id} id={definition.slug + "-" + choice.id} /><span className="text-sm font-medium">{choice.label}</span></label>)}</RadioGroup>}
      {step.kind === "QUESTION" && step.question.type !== "MULTIPLE_CHOICE" && <div><label htmlFor="mastery-response" className="text-sm font-semibold">Ta réponse</label><Textarea id="mastery-response" value={draft} onChange={(event) => state.setDraft(definition.id, event.target.value)} disabled={Boolean(feedback)} className="mt-2 min-h-32" placeholder="Explique avec tes propres mots…" /><p className="mt-1 text-xs text-slate-500">Enregistrée localement.</p></div>}
      {needsConfidence && <fieldset disabled={Boolean(feedback)}><legend className="text-sm font-semibold">Confiance avant validation</legend><div className="mt-2 grid grid-cols-5 gap-2">{[1,2,3,4,5].map((value) => <button key={value} type="button" onClick={() => { state.setConfidence(definition.id, value); if (step.kind === "SELF_EVALUATION") state.setDraft(definition.id, String(value)); }} aria-pressed={confidence === value} className={"min-h-11 rounded-xl border text-sm font-semibold " + (confidence === value ? "border-emerald-800 bg-emerald-800 text-white" : "border-slate-200")}>{value}</button>)}</div></fieldset>}
      {hintCount > 0 && <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4"><p className="text-xs font-semibold uppercase text-cyan-800">Indice {hintCount}/3</p><p className="mt-2 text-sm text-cyan-950">{availableHints[hintCount - 1]}</p></div>}
      {feedback && <div role="status" className={"rounded-xl border p-4 text-sm " + (feedback.correct ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-amber-200 bg-amber-50 text-amber-950")}>{feedback.message}</div>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">{availableHints.length ? <Button variant="ghost" onClick={() => state.showHint(definition)} disabled={hintCount >= availableHints.length || Boolean(feedback?.correct)}><HelpCircle />{hintCount ? "Indice suivant" : "Besoin d’un indice ?"}</Button> : <span />}{!feedback && <Button onClick={() => state.submit(definition, step.kind === "CONTENT" ? "acknowledged" : undefined, step.kind === "CONTENT" ? 5 : undefined)} disabled={!canSubmit}><Send />{step.kind === "CONTENT" ? "Continuer" : "Vérifier"}</Button>}{feedback && !feedback.correct && <Button onClick={() => state.retry(definition)}><RotateCcw />Réessayer</Button>}{feedback?.correct && <Button onClick={() => state.continueStep(definition)}>{attempt.currentStepIndex === steps.length - 1 ? "Terminer" : "Continuer"}<ArrowRight /></Button>}</div>
    </CardContent></Card>
  </div></>;
}

function Summary({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-white p-4"><p className="text-xs font-semibold uppercase text-slate-500">{label}</p><p className="mt-1 font-semibold">{value}</p></div>; }
