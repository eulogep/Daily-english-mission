"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, HelpCircle, RotateCcw, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLearningRecordStore } from "@/modules/learning-records/browser-store";
import { reviewEvidenceFromResult, reviewIsTraceable, reviewStatusAt } from "@/modules/review-engine/core";
import { useReviewEngineStore } from "@/modules/review-engine/browser-store";
import type { ReviewItem } from "@/modules/review-engine/types";

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(timestamp));
}

function sameLocalDay(left: number, right: number) {
  const a = new Date(left);
  const b = new Date(right);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function ReviewCard({ item, onStart }: { item: ReviewItem; onStart?: () => void }) {
  const [whyOpen, setWhyOpen] = useState(false);
  const patterns = useReviewEngineStore((state) => state.errorPatterns);
  const evidence = useLearningRecordStore((state) => state.evidence);
  const traceable = reviewIsTraceable(item, patterns, evidence);
  const related = patterns.filter((pattern) => item.errorPatternIds.includes(pattern.id));
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-800"><RotateCcw className="size-5" aria-hidden="true" /></span>
        <div className="flex-1"><p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700">Excel / Import CSV</p><h3 className="mt-1 font-semibold">{item.title}</h3><p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500"><Clock3 className="size-3.5" aria-hidden="true" />Environ 2 min</p></div>
        <div className="flex flex-wrap gap-2"><Button variant="ghost" onClick={() => setWhyOpen((open) => !open)}>Pourquoi ?</Button>{onStart && <Button onClick={onStart}>Commencer</Button>}</div>
      </CardContent>
      {whyOpen && <div className="border-t border-slate-100 px-5 py-4 text-sm text-slate-600"><p>{item.whyDue}</p><ul className="mt-2 list-disc space-y-1 pl-5">{related.map((pattern) => <li key={pattern.id}>{pattern.description}</li>)}</ul><p className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald-800"><ShieldCheck className="size-4" />{traceable ? "Reliée à une preuve de ta mission Excel." : "Source indisponible — cette révision ne peut pas être lancée."}</p>{traceable && <Link href="/evidence" className="mt-2 inline-flex items-center gap-1 font-semibold text-emerald-800">Voir la preuve <ArrowRight className="size-3.5" /></Link>}</div>}
    </Card>
  );
}

function ActiveReview({ item, queuePosition, queueSize }: { item: ReviewItem; queuePosition: number; queueSize: number }) {
  const draft = useReviewEngineStore((state) => state.drafts[item.id] ?? "");
  const feedback = useReviewEngineStore((state) => state.feedback[item.id]);
  const hintCount = useReviewEngineStore((state) => state.hints[item.id] ?? 0);
  const retryCount = useReviewEngineStore((state) => state.retries[item.id] ?? 0);
  const setDraft = useReviewEngineStore((state) => state.setDraft);
  const submitAnswer = useReviewEngineStore((state) => state.submitAnswer);
  const retry = useReviewEngineStore((state) => state.retry);
  const showHint = useReviewEngineStore((state) => state.showHint);
  const finishReview = useReviewEngineStore((state) => state.finishReview);
  const addEvidenceRecords = useLearningRecordStore((state) => state.addEvidenceRecords);

  const finish = (correct: boolean, confidence: number | null) => {
    const result = finishReview(item.id, correct, confidence);
    if (result) addEvidenceRecords([reviewEvidenceFromResult(item, result)]);
  };

  return (
    <Card className="mx-auto max-w-3xl border-emerald-900/15 bg-white shadow-lg">
      <CardHeader className="space-y-4 border-b border-slate-100">
        <div className="flex items-center justify-between gap-3"><Badge variant="outline">Révision {queuePosition} sur {queueSize}</Badge><span className="text-sm text-slate-500">{Math.round(((queuePosition - 1) / Math.max(1, queueSize)) * 100)} %</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-700 transition-all" style={{ width: `${Math.max(8, ((queuePosition - 1) / Math.max(1, queueSize)) * 100)}%` }} /></div>
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">{item.title}</p><CardTitle className="mt-3 text-2xl leading-8">{item.prompt}</CardTitle></div>
      </CardHeader>
      <CardContent className="space-y-5 p-6">
        {item.reviewType === "MULTIPLE_CHOICE" ? <div className="grid gap-3">{item.choices?.map((choice) => <Button key={choice.id} type="button" variant={draft === choice.id ? "default" : "outline"} className="h-auto min-h-12 justify-start whitespace-normal text-left" onClick={() => !feedback && setDraft(item.id, choice.id)}>{choice.label}</Button>)}</div> : <Input value={draft} disabled={Boolean(feedback)} onChange={(event) => setDraft(item.id, event.target.value)} placeholder="Écris ta réponse avant de voir le feedback" className="min-h-12" />}
        {!feedback && <Button onClick={() => submitAnswer(item.id)} disabled={!draft.trim()} className="w-full sm:w-auto">Valider ma réponse</Button>}
        {feedback && <div role="status" className={`rounded-xl border p-4 ${feedback.correct ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-amber-200 bg-amber-50 text-amber-950"}`}><p className="flex items-center gap-2 font-semibold">{feedback.correct ? <CheckCircle2 className="size-5" /> : <RotateCcw className="size-5" />}{feedback.correct ? "Réponse correcte" : "À renforcer"}</p><p className="mt-2 text-sm leading-6">{feedback.message}</p></div>}
        {feedback && !feedback.correct && <div className="space-y-3"><div className="flex flex-wrap gap-2"><Button onClick={() => retry(item.id)}>Réessayer</Button><Button variant="outline" onClick={() => finish(false, null)}>Revoir bientôt</Button>{hintCount === 0 && <Button variant="ghost" onClick={() => showHint(item.id)}><HelpCircle />Voir un indice</Button>}</div>{hintCount > 0 && <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700"><strong>Indice :</strong> {item.hint}</p>}<p className="text-xs text-slate-500">Nouveaux essais dans cette révision : {retryCount}</p></div>}
        {feedback?.correct && <div className="rounded-xl bg-slate-50 p-4"><p className="text-sm font-semibold">Quelle est ta confiance dans cette réponse ?</p><div className="mt-3 flex flex-wrap gap-2">{[1,2,3,4,5].map((value) => <Button key={value} variant="outline" size="sm" onClick={() => finish(true, value)}>{value}/5</Button>)}</div><p className="mt-2 text-xs text-slate-500">Ta confiance est enregistrée séparément de la correction.</p></div>}
      </CardContent>
    </Card>
  );
}

export function ReviewWorkspace() {
  const { hydrated, reviewItems, results, activeItemId, startReview } = useReviewEngineStore();
  const patterns = useReviewEngineStore((state) => state.errorPatterns);
  const evidence = useLearningRecordStore((state) => state.evidence);
  const now = Date.now();
  if (!hydrated) return <p className="text-sm text-slate-500">Chargement des révisions locales…</p>;
  const validItems = reviewItems.filter((item) => reviewIsTraceable(item, patterns, evidence));
  const due = validItems.filter((item) => reviewStatusAt(item, now) === "DUE");
  const upcoming = validItems.filter((item) => reviewStatusAt(item, now) === "UPCOMING");
  const completedToday = results.filter((result) => sameLocalDay(result.completedAt, now));
  const active = validItems.find((item) => item.id === activeItemId);
  if (active) return <ActiveReview item={active} queuePosition={Math.max(1, due.findIndex((item) => item.id === active.id) + 1)} queueSize={Math.max(1, due.length)} />;

  return (
    <div className="space-y-8">
      <header className="space-y-3"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Révisions fondées sur tes preuves</p><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Renforce ce qui a réellement posé problème</h1><p className="max-w-2xl leading-7 text-slate-600">Une courte tentative avant le feedback, sans score global ni urgence artificielle.</p>{due.length > 0 && <Button size="lg" onClick={() => startReview(due[0].id)}>Commencer la révision <ArrowRight /></Button>}</header>
      <section aria-labelledby="due-title" className="space-y-4"><div className="flex items-center justify-between"><h2 id="due-title" className="text-xl font-semibold">Révisions dues</h2><Badge>{due.length}</Badge></div>{due.length ? <div className="grid gap-4">{due.map((item) => <ReviewCard key={item.id} item={item} onStart={() => startReview(item.id)} />)}</div> : <Card><CardContent className="p-6 text-sm text-slate-600">Aucune révision due. Les prochaines apparaîtront uniquement à partir de preuves réelles.</CardContent></Card>}</section>
      <section aria-labelledby="upcoming-title" className="space-y-4"><h2 id="upcoming-title" className="text-xl font-semibold">À venir</h2>{upcoming.length ? <div className="grid gap-3">{upcoming.map((item) => <div key={item.id} className="rounded-xl border border-slate-200 bg-white px-4 py-3"><p className="font-medium">{item.title}</p><p className="mt-1 text-sm text-slate-500">Prochaine révision : {formatDate(item.nextReviewAt)}</p></div>)}</div> : <p className="text-sm text-slate-500">Aucune révision à venir.</p>}</section>
      <section aria-labelledby="completed-title" className="space-y-3"><h2 id="completed-title" className="text-xl font-semibold">Terminées aujourd’hui</h2><p className="text-sm text-slate-600">{completedToday.length ? `${completedToday.length} révision(s) terminée(s) aujourd’hui.` : "Aucune révision terminée aujourd’hui."}</p></section>
    </div>
  );
}
