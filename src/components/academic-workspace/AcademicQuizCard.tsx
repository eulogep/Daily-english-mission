"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowRight, CirclePause, Lightbulb, RotateCcw, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAcademicWorkspaceStore } from "@/modules/academic-workspace/browser-store";
import { academicQuizOutcome, nextAcademicDifficulty } from "@/modules/academic-workspace/core";
import type { AcademicQuizDefinition } from "@/modules/academic-workspace/types";
import { AcademicRecordBridge } from "./AcademicRecordBridge";
import { AcademicRemediationHub } from "./AcademicRemediationHub";

export function AcademicQuizCard({ definition, sourceTitle }: { definition: AcademicQuizDefinition; sourceTitle: string }) {
  const state = useAcademicWorkspaceStore();
  const attempt = state.attempts[definition.id];
  useEffect(() => {
    void Promise.resolve(useAcademicWorkspaceStore.persist.rehydrate()).then(() => {
      useAcademicWorkspaceStore.getState().markHydrated();
      useAcademicWorkspaceStore.getState().prepare(definition);
    });
  }, [definition]);
  if (!state.hydrated || !attempt) return <Card><CardContent className="p-6 text-sm text-slate-500">Restauration du quiz local…</CardContent></Card>;
  const question = definition.questions[attempt.currentQuestionIndex];
  const feedback = question ? attempt.feedback[question.id] : undefined;
  const remediation = question ? attempt.remediations?.[question.id] : undefined;
  const retrieval = question ? (attempt.retrievalQuestionIds ?? []).includes(question.id) : false;
  const draft = state.drafts[definition.id] ?? "";
  const outcome = academicQuizOutcome(attempt, definition);
  const fragileQuestions = definition.questions.filter((item) => (attempt.attempts[item.id] ?? 0) >= 3);
  return <><AcademicRecordBridge definition={definition} /><Card id="pdf-quiz"><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle>{definition.title}</CardTitle><Badge variant="outline">{definition.mode ?? "STANDARD"}</Badge></div></CardHeader><CardContent className="space-y-5">
    {attempt.status === "READY" && <><p className="text-slate-600">{definition.questions.length} questions déterministes avec pages, section et concepts vérifiés.</p><Button onClick={() => state.start(definition)}>Commencer le quiz <ArrowRight /></Button></>}
    {attempt.status === "PAUSED" && <><p>Quiz en pause. La question actuelle est conservée localement.</p><Button onClick={() => state.resume(definition)}>Reprendre</Button></>}
    {attempt.status === "COMPLETED" && <div className="space-y-4"><Badge>Compétence : {outcome.maxState}</Badge><h2 className="text-2xl font-semibold">Quiz PDF terminé</h2><p className="text-slate-600">La preuve conserve les pages utilisées. Ce mode reste plafonné à Pratiquée.</p><p className="text-sm">Prochaine difficulté : <strong>{nextAcademicDifficulty(attempt)}</strong></p>{fragileQuestions.length > 0 && <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-950"><p className="font-semibold">À retravailler</p>{fragileQuestions.map((item) => <p className="mt-2" key={item.id}>{item.conceptIds.join(", ")} : {attempt.attempts[item.id]} essais.</p>)}<div className="mt-3 flex flex-wrap gap-2"><Badge variant="outline">Mini-leçon</Badge><Badge variant="outline">Carte mentale</Badge><Badge variant="outline">Revoir {fragileQuestions[0].pageStart === fragileQuestions[0].pageEnd ? `la page ${fragileQuestions[0].pageStart}` : `les pages ${fragileQuestions[0].pageStart}–${fragileQuestions[0].pageEnd}`}</Badge></div></div>}<div className="flex flex-wrap gap-3"><Button asChild><Link href="/evidence">Voir la preuve</Link></Button><Button variant="outline" asChild><Link href="/review">Voir les révisions</Link></Button><Button variant="outline" onClick={() => state.restart(definition)}><RotateCcw />Retester</Button></div></div>}
    {attempt.status === "IN_PROGRESS" && question && <div className="space-y-5">
      <div className="flex items-center justify-between gap-3"><Badge variant="outline">Question {attempt.currentQuestionIndex + 1}/{definition.questions.length}</Badge><Button variant="outline" size="sm" onClick={() => state.pause(definition)}><CirclePause />Pause</Button></div>
      <div><h2 className="text-xl font-semibold">{retrieval && question.retrievalPrompt ? question.retrievalPrompt : question.prompt}</h2><p className="mt-2 text-xs text-slate-500">Source : {sourceTitle} · pages {question.pageStart}–{question.pageEnd} · section {question.sectionId} · concepts {question.conceptIds.join(", ")}</p>{retrieval && <Badge className="mt-2" variant="outline">Rappel support fermé</Badge>}</div>
      {question.responseType === "MULTIPLE_CHOICE" ? <div className="grid gap-2">{question.choices?.map((choice) => <button key={choice.id} className={`rounded-xl border p-3 text-left ${draft === choice.id ? "border-emerald-600 bg-emerald-50" : "border-slate-200"}`} onClick={() => state.setDraft(definition.id, choice.id)}>{choice.label}</button>)}</div> : <input className="w-full rounded-xl border border-slate-300 p-3" value={draft} onChange={(event) => state.setDraft(definition.id, event.target.value)} />}
      {attempt.hintsUsed[question.id] ? <p className="flex gap-2 rounded-lg bg-cyan-50 p-3 text-sm text-cyan-900"><Lightbulb className="size-4 shrink-0" />{question.hint}</p> : <Button variant="outline" onClick={() => state.showHint(definition)}>Voir un indice</Button>}
      {!feedback && <Button disabled={!draft.trim()} onClick={() => state.submit(definition)}>Vérifier</Button>}
      {feedback && <div className={`rounded-xl p-4 text-sm ${feedback.correct ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"}`}><p>{feedback.message}</p><div className="mt-3">{feedback.correct ? <Button onClick={() => state.continueQuiz(definition)}>Continuer</Button> : !remediation || remediation.supportClosedAt ? <Button variant="outline" onClick={() => state.retry(definition)}>Nouvel essai</Button> : null}</div></div>}
      {remediation && !remediation.supportClosedAt && <AcademicRemediationHub question={question} remediation={remediation} onSelect={(methodId) => state.selectRemediation(definition, methodId)} onClose={() => state.closeRemediation(definition)} />}
    </div>}
    <p className="flex gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600"><ShieldCheck className="size-4 shrink-0 text-emerald-700" />Le PDF original reste canonique; le quiz n’utilise que les pages explicitement citées.</p>
  </CardContent></Card></>;
}
