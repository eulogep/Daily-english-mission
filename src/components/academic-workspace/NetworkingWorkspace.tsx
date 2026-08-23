"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, CirclePause, Lightbulb, RotateCcw, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAcademicWorkspaceStore } from "@/modules/academic-workspace/browser-store";
import { academicQuizOutcome, nextAcademicDifficulty } from "@/modules/academic-workspace/core";
import { academicWorkspaceRegistry, networkingQuiz, networkingSection } from "@/modules/academic-workspace/pilot-registry";
import { AcademicRecordBridge } from "./AcademicRecordBridge";
import { CourseClassificationForm } from "./CourseClassificationForm";

export function NetworkingWorkspace() {
  const state = useAcademicWorkspaceStore();
  const attempt = state.attempts[networkingQuiz.id];
  useEffect(() => {
    void Promise.resolve(useAcademicWorkspaceStore.persist.rehydrate()).then(() => {
      useAcademicWorkspaceStore.getState().markHydrated();
      useAcademicWorkspaceStore.getState().prepare(networkingQuiz);
    });
  }, []);
  if (!state.hydrated || !attempt) return <p className="text-sm text-slate-500">Restauration de ton espace académique local…</p>;
  const question = networkingQuiz.questions[attempt.currentQuestionIndex];
  const feedback = question ? attempt.feedback[question.id] : undefined;
  const draft = state.drafts[networkingQuiz.id] ?? "";
  const outcome = academicQuizOutcome(attempt, networkingQuiz);
  const source = academicWorkspaceRegistry.sources.find((item) => item.id === networkingSection.sourceId)!;
  const ingestion = academicWorkspaceRegistry.ingestions.find((item) => item.sourceId === source.id)!;
  const pdfIngestion = academicWorkspaceRegistry.ingestions.find((item) => item.format === "PDF")!;

  return <><AcademicRecordBridge definition={networkingQuiz} /><div className="space-y-7">
    <header><p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Matière active</p><h1 className="mt-2 text-3xl font-semibold">Réseaux</h1><p className="mt-2 max-w-3xl leading-7 text-slate-600">Cours local → section vérifiée → concepts → quiz → preuve → révision.</p></header>
    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="size-5 text-emerald-700" />{networkingSection.title}</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2"><Badge>ACADEMIC_PERSONAL_USE</Badge><Badge variant="outline">{ingestion.status}</Badge></div>
        <ul className="space-y-3 text-sm leading-6 text-slate-700">{networkingSection.summary.map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-1 size-4 shrink-0 text-emerald-700" />{item}</li>)}</ul>
        <div className="rounded-xl bg-slate-50 p-4 text-sm"><p className="font-semibold">Retour à la source</p><p className="mt-1 break-words text-slate-600">{source.originalPathOrReference}</p><p className="mt-1 text-slate-600">{networkingSection.sourceReference}</p></div>
        <p className="text-xs text-slate-500">Résumé dérivé, non canonique. La source locale reste la référence.</p>
      </CardContent></Card>
      <Card><CardHeader><CardTitle>État d’ingestion</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">
        <p><strong>DOCX :</strong> section bornée extraite localement.</p>
        <p><strong>PDF :</strong> {pdfIngestion.status}</p>
        <p className="rounded-lg bg-emerald-50 p-3 text-emerald-900">TEXT_PDF · 42 pages détectées · pages 14–20 ingérées avec provenance.</p>
        <Button asChild><Link href="/subjects/networking/sources/ch01-introduction-inf3050">Ouvrir la source PDF <ArrowRight /></Link></Button>
      </CardContent></Card>
    </div>

    <Card><CardHeader><CardTitle>{networkingQuiz.title}</CardTitle></CardHeader><CardContent className="space-y-5">
      {attempt.status === "READY" && <><p className="text-slate-600">3 questions déterministes. Chaque question cite une source, une section et des concepts.</p><Button onClick={() => state.start(networkingQuiz)}>Commencer le quiz <ArrowRight /></Button></>}
      {attempt.status === "PAUSED" && <><p>Quiz en pause. Ton état est conservé sur cet appareil.</p><Button onClick={() => state.resume(networkingQuiz)}>Reprendre</Button></>}
      {attempt.status === "COMPLETED" && <div className="space-y-4"><Badge>Compétence : {outcome.maxState}</Badge><h2 className="text-2xl font-semibold">Quiz terminé</h2><p className="text-slate-600">Preuve guidée enregistrée et reliée au cours. Ce quiz ne peut pas attribuer Démontrée ou Retenue.</p><p className="text-sm">Prochaine difficulté : <strong>{nextAcademicDifficulty(attempt)}</strong></p><div className="flex flex-wrap gap-3"><Button asChild><Link href="/evidence">Voir la preuve</Link></Button><Button variant="outline" asChild><Link href="/review">Voir les révisions</Link></Button><Button variant="outline" onClick={() => state.restart(networkingQuiz)}><RotateCcw />Nouvelle tentative</Button></div></div>}
      {attempt.status === "IN_PROGRESS" && question && <div className="space-y-5">
        <div className="flex items-center justify-between gap-3"><Badge variant="outline">Question {attempt.currentQuestionIndex + 1}/{networkingQuiz.questions.length}</Badge><Button variant="outline" size="sm" onClick={() => state.pause(networkingQuiz)}><CirclePause />Pause</Button></div>
        <div><h2 className="text-xl font-semibold">{question.prompt}</h2><p className="mt-2 text-xs text-slate-500">Source : {source.title} · Section : {networkingSection.title} · Concepts : {question.conceptIds.join(", ")}</p></div>
        {question.responseType === "MULTIPLE_CHOICE" ? <div className="grid gap-2">{question.choices?.map((choice) => <button key={choice.id} className={`rounded-xl border p-3 text-left ${draft === choice.id ? "border-emerald-600 bg-emerald-50" : "border-slate-200"}`} onClick={() => state.setDraft(networkingQuiz.id, choice.id)}>{choice.label}</button>)}</div> : <input className="w-full rounded-xl border border-slate-300 p-3" value={draft} onChange={(event) => state.setDraft(networkingQuiz.id, event.target.value)} />}
        {attempt.hintsUsed[question.id] ? <p className="flex gap-2 rounded-lg bg-cyan-50 p-3 text-sm text-cyan-900"><Lightbulb className="size-4 shrink-0" />{question.hint}</p> : <Button variant="outline" onClick={() => state.showHint(networkingQuiz)}>Voir un indice</Button>}
        {!feedback && <Button disabled={!draft.trim()} onClick={() => state.submit(networkingQuiz)}>Vérifier</Button>}
        {feedback && <div className={`rounded-xl p-4 text-sm ${feedback.correct ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"}`}><p>{feedback.message}</p><div className="mt-3">{feedback.correct ? <Button onClick={() => state.continueQuiz(networkingQuiz)}>Continuer</Button> : <Button variant="outline" onClick={() => state.retry(networkingQuiz)}>Nouvel essai</Button>}</div></div>}
      </div>}
      <p className="flex gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600"><ShieldCheck className="size-4 shrink-0 text-emerald-700" />Pas de score décoratif : seuls les essais, aides, réponses et liens de provenance alimentent la preuve.</p>
    </CardContent></Card>

    <div className="grid gap-5 lg:grid-cols-2"><CourseClassificationForm /><Card><CardHeader><CardTitle>Interroger ce cours</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm leading-6 text-slate-600">Contrat prêt : toute réponse devra distinguer contenu sourcé et inférence, citer la section et exposer l’incertitude.</p><Button disabled>Question au cours — bientôt disponible</Button><p className="text-xs text-slate-500">Aucun fournisseur IA configuré. Aucun appel externe.</p></CardContent></Card></div>
    <div className="flex flex-wrap gap-3"><Button variant="outline" asChild><Link href="/subjects">Toutes les matières</Link></Button><Button variant="outline" asChild><Link href="/progress">Progression</Link></Button><Button variant="outline" asChild><Link href="/review">Révisions</Link></Button><Button variant="outline" disabled>Deep Mastery réseau — futur ticket</Button></div>
  </div></>;
}
