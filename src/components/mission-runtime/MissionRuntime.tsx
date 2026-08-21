"use client";

import { useEffect } from "react";
import { ArrowRight, Download, HelpCircle, Paperclip, RotateCcw, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { createMissionAttempt } from "@/modules/mission-runtime/attempt-state";
import { useMissionRuntimeStore } from "@/modules/mission-runtime/store";
import type { MissionDefinition } from "@/modules/mission-runtime/types";
import { EvidenceInput } from "./EvidenceInput";
import { FeedbackPanel, HintPanel, MissionCompletion, MissionHeader, MissionStepper, ResumePanel } from "./MissionRuntimeParts";

export function MissionRuntime({ mission }: { mission: MissionDefinition }) {
  const state = useMissionRuntimeStore();
  const attempt = state.attempts[mission.id] ?? createMissionAttempt(mission);
  const draft = state.drafts[mission.id] ?? "";

  useEffect(() => {
    void Promise.resolve(useMissionRuntimeStore.persist.rehydrate()).then(state.markHydrated);
  }, [state.markHydrated]);

  useEffect(() => {
    if (state.hydrated && !state.attempts[mission.id]) state.prepare(mission);
  }, [mission, state.attempts, state.hydrated, state.prepare]);

  useEffect(() => {
    if (state.hydrated && attempt.status === "IN_PROGRESS") state.viewStep(mission);
  }, [attempt.currentStepIndex, attempt.status, mission, state.hydrated, state.viewStep]);

  useEffect(() => {
    if (!state.hydrated || attempt.status !== "IN_PROGRESS") return;

    const suspend = () => state.suspendActivity(mission);
    const syncActivity = () => {
      if (document.visibilityState === "visible" && document.hasFocus()) state.activateActivity(mission);
      else suspend();
    };

    syncActivity();
    document.addEventListener("visibilitychange", syncActivity);
    window.addEventListener("focus", syncActivity);
    window.addEventListener("blur", suspend);
    window.addEventListener("pagehide", suspend);
    return () => {
      document.removeEventListener("visibilitychange", syncActivity);
      window.removeEventListener("focus", syncActivity);
      window.removeEventListener("blur", suspend);
      window.removeEventListener("pagehide", suspend);
      suspend();
    };
  }, [attempt.status, mission, state.activateActivity, state.hydrated, state.suspendActivity]);

  if (!state.hydrated) return <div className="mx-auto max-w-2xl animate-pulse rounded-2xl bg-slate-200 p-16" aria-label="Chargement de la mission" />;
  if (attempt.status === "READY") return <ResumePanel mission={mission} paused={false} onAction={() => state.start(mission)} />;
  if (attempt.status === "PAUSED") return <ResumePanel mission={mission} paused onAction={() => state.resume(mission)} />;
  if (attempt.status === "COMPLETED") {
    const hints = Object.values(attempt.hintsUsed).reduce((sum, count) => sum + count, 0);
    const retries = attempt.events.filter((event) => event.type === "RETRY").length;
    return <MissionCompletion mission={mission} elapsedMs={attempt.elapsedMs} timingReliable={attempt.timingReliable} hints={hints} retries={retries} onReset={() => state.reset(mission)} />;
  }

  const step = mission.steps[attempt.currentStepIndex];
  const feedback = attempt.feedback[step.id];
  const hintCount = attempt.hintsUsed[step.id] ?? 0;
  const attemptCount = attempt.attempts[step.id] ?? 0;
  const availableHints = step.hints ?? [];
  const canShowHint = hintCount < availableHints.length && (hintCount === 0 || attemptCount >= hintCount);
  const acknowledgementStep = step.kind === "information" || step.kind === "resource";

  return <div className="mx-auto max-w-4xl space-y-5">
    <MissionHeader mission={mission} completed={attempt.completedStepIds.length} onPause={() => state.pause(mission)} />
    <MissionStepper mission={mission} current={attempt.currentStepIndex} completed={attempt.completedStepIds} />

    <Card className="border-slate-200 bg-white shadow-md">
      <CardContent className="space-y-6 p-6 sm:p-8">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Étape {attempt.currentStepIndex + 1} sur {mission.steps.length}</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">{step.title}</h2><p className="mt-3 max-w-2xl leading-7 text-slate-700">{step.instruction}</p></div>

        {(step.why || step.example || step.details) && <div className="flex flex-wrap gap-2">
          {step.why && <details className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"><summary className="cursor-pointer font-medium">Pourquoi ?</summary><p className="mt-2 max-w-xl leading-6 text-slate-600">{step.why}</p></details>}
          {step.example && <details className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"><summary className="cursor-pointer font-medium">Voir un exemple</summary><p className="mt-2 max-w-xl leading-6 text-slate-600">{step.example}</p></details>}
          {step.details && <details className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"><summary className="cursor-pointer font-medium">Voir les étapes détaillées</summary><ol className="mt-2 space-y-2 pl-5 text-slate-600">{step.details.map((detail, index) => <li key={detail} className="list-decimal leading-6">{detail}</li>)}</ol></details>}
        </div>}

        {step.kind === "resource" && step.resource && <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-cyan-800">{step.resource.classification}</p><Button asChild className="mt-3"><a href={step.resource.href} download={step.resource.downloadName}><Download aria-hidden="true" />{step.resource.label}</a></Button><p className="mt-2 text-xs text-cyan-900/70">8 lignes · 5 colonnes · fichier synthétique</p></div>}

        {step.kind === "multiple_choice" && <RadioGroup value={draft} onValueChange={(value) => state.setDraft(mission.id, value)} disabled={Boolean(feedback)} aria-label="Choisis une réponse">
          {step.choices?.map((choice) => <label key={choice.id} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 transition-colors hover:border-emerald-400 hover:bg-emerald-50/50"><RadioGroupItem value={choice.id} id={`${mission.slug}-${choice.id}`} /><span className="text-sm font-medium">{choice.label}</span></label>)}
        </RadioGroup>}

        {["short_answer", "long_text", "evidence_prompt"].includes(step.kind) && <div className="space-y-2">
          <label htmlFor={`${mission.slug}-response`} className="flex items-center gap-2 text-sm font-semibold">{step.kind === "evidence_prompt" && <Paperclip className="size-4 text-emerald-700" aria-hidden="true" />}Ta réponse</label>
          <Textarea id={`${mission.slug}-response`} value={draft} onChange={(event) => state.setDraft(mission.id, event.target.value)} disabled={Boolean(feedback)} placeholder="Écris ici, sans utiliser un chat…" className="min-h-28 resize-y" />
          <p className="text-xs text-slate-500">Enregistrée localement à chaque modification.</p>
        </div>}

        {step.kind === "evidence_submission" && <EvidenceInput existing={attempt.evidence[step.id]} disabled={Boolean(feedback)} onSaved={(metadata) => state.submitEvidence(mission, metadata)} />}

        {step.kind === "self_assessment" && <fieldset><legend className="text-sm font-semibold">Confiance pour refaire seul</legend><div className="mt-3 grid grid-cols-5 gap-2">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" onClick={() => state.setDraft(mission.id, String(value))} disabled={Boolean(feedback)} aria-pressed={draft === String(value)} className={`min-h-12 rounded-xl border text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${draft === String(value) ? "border-emerald-800 bg-emerald-800 text-white" : "border-slate-200 bg-white hover:bg-slate-50"}`}>{value}</button>)}</div><div className="mt-1 flex justify-between text-xs text-slate-500"><span>Pas encore</span><span>Oui, seul</span></div></fieldset>}

        {hintCount > 0 && <HintPanel hint={availableHints[hintCount - 1]} level={hintCount} />}
        {feedback && <FeedbackPanel feedback={feedback} />}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
          {availableHints.length > 0 ? <Button type="button" variant="ghost" onClick={() => state.showHint(mission)} disabled={!canShowHint || Boolean(feedback?.correct)}><HelpCircle aria-hidden="true" />{hintCount ? "Un autre indice" : "Besoin d’un indice ?"}</Button> : <span />}
          {!feedback && acknowledgementStep && <Button type="button" onClick={() => state.submit(mission, "acknowledged")}><Send aria-hidden="true" />{step.kind === "resource" ? "J’ai accès au fichier" : "Continuer"}</Button>}
          {!feedback && !acknowledgementStep && step.kind !== "evidence_submission" && <Button type="button" onClick={() => state.submit(mission)} disabled={!draft.trim()}><Send aria-hidden="true" />Vérifier ma réponse</Button>}
          {feedback && !feedback.correct && <Button type="button" onClick={() => state.retry(mission)}><RotateCcw aria-hidden="true" />Réessayer</Button>}
          {feedback?.correct && <Button type="button" onClick={() => state.continueStep(mission)}>{attempt.currentStepIndex === mission.steps.length - 1 ? <><Sparkles aria-hidden="true" />Terminer</> : <>Continuer<ArrowRight aria-hidden="true" /></>}</Button>}
        </div>
      </CardContent>
    </Card>
  </div>;
}
