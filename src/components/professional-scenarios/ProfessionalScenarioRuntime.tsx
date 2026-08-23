"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, BriefcaseBusiness, CheckCircle2, HelpCircle, LoaderCircle, Pause, RotateCcw, Send, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { createProfessionalScenarioAttempt, professionalScenarioOutcome } from "@/modules/professional-scenarios/core";
import { hydrateProfessionalScenarioStore, useProfessionalScenarioStore } from "@/modules/professional-scenarios/browser-store";
import type { ProfessionalAssistanceUsed, ProfessionalScenarioDefinition, ProfessionalWritingNotes, ProfessionalWritingSection } from "@/modules/professional-scenarios/types";
import type { ProfessionalEvaluationDimension } from "@/modules/learning-records/types";
import { ProfessionalScenarioRecordBridge } from "./ProfessionalScenarioRecordBridge";

const phaseLabels = {
  ANALYSIS: "Analyse",
  DECISION: "Décision",
  PROFESSIONAL_RESPONSE: "Compte rendu",
  SELF_CHECK: "Auto-contrôle",
} as const;

const dimensionLabels: Record<ProfessionalEvaluationDimension, string> = {
  FACTUAL_ACCURACY: "Exactitude factuelle",
  PROBLEM_IDENTIFICATION: "Identification du problème",
  UNCERTAINTY_HANDLING: "Gestion de l’incertitude",
  ACTIONABILITY: "Caractère actionnable",
  COMMUNICATION_CLARITY: "Clarté de la communication",
};

const assistanceOptions: Array<{ id: ProfessionalAssistanceUsed; label: string; description: string }> = [
  { id: "NONE", label: "Aucune aide", description: "J’ai rédigé la réponse moi-même." },
  { id: "IN_APP_SCAFFOLD", label: "Canevas intégré", description: "J’ai utilisé la structure et les notes guidées de l’application." },
  { id: "EXTERNAL_AI", label: "IA externe", description: "Une IA externe a généré ou fortement rédigé le texte final." },
  { id: "OTHER", label: "Autre aide", description: "J’ai utilisé une autre forme d’assistance." },
];

function assistanceLabel(value?: ProfessionalAssistanceUsed) {
  return assistanceOptions.find((option) => option.id === value)?.label ?? "À déclarer";
}

function AssistanceDisclosure({ value, onChange }: { value?: ProfessionalAssistanceUsed; onChange: (value: ProfessionalAssistanceUsed) => void }) {
  return <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-sm font-semibold">Aide utilisée pour le texte final</p><p className="mt-1 text-xs text-slate-500">La réponse peut être terminée avec une aide. La preuve indiquera simplement son niveau d’autonomie.</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{assistanceOptions.map((option) => <Button key={option.id} type="button" variant={value === option.id ? "default" : "outline"} className="h-auto justify-start whitespace-normal px-3 py-3 text-left" onClick={() => onChange(option.id)}><span><span className="block font-semibold">{option.label}</span><span className="mt-1 block text-xs font-normal opacity-80">{option.description}</span></span></Button>)}</div>{value === "EXTERNAL_AI" && <p className="mt-3 text-xs text-amber-800">La tâche peut être terminée, mais ce texte ne sera pas considéré comme une preuve autonome de rédaction professionnelle.</p>}</div>;
}

function WritingScaffold({ notes, onNote, onOrganize, onNeedHelp }: { notes: ProfessionalWritingNotes; onNote: (section: ProfessionalWritingSection, value: string) => void; onOrganize: () => void; onNeedHelp: () => void }) {
  const [open, setOpen] = useState(false);
  function openHelp() { setOpen(true); onNeedHelp(); }
  const sections: Array<{ id: ProfessionalWritingSection; label: string; prompt: string }> = [
    { id: "observation", label: "OBSERVATION", prompt: "Qu’est-ce qui est réellement observé ?" },
    { id: "impact", label: "IMPACT / IMPORTANCE", prompt: "Pourquoi cela mérite-t-il une vérification ?" },
    { id: "uncertainty", label: "INCERTITUDE", prompt: "Qu’est-ce qui n’est pas encore confirmé ?" },
    { id: "nextAction", label: "PROCHAINE ACTION", prompt: "Que faut-il vérifier ou faire ensuite ?" },
  ];
  return <div className="space-y-4"><Card className="border-cyan-200 bg-cyan-50/60"><CardContent className="p-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-900">Structure de travail</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{sections.map((section, index) => <div key={section.id} className="rounded-xl bg-white p-4"><p className="text-xs font-bold text-cyan-900">{index + 1}. {section.label}</p><p className="mt-2 text-sm text-slate-700">{section.prompt}</p></div>)}</div></CardContent></Card>
    <Card className="border-slate-200"><CardContent className="p-5"><Badge variant="outline">EXEMPLE DE STRUCTURE · TRAINING_SYNTHETIC</Badge><p className="mt-3 text-sm text-slate-500">Cas différent : préparation d’un planning de maintenance fictif.</p><div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-700"><p><strong>Observation :</strong> deux interventions du planning n’ont pas encore de date validée.</p><p><strong>Importance :</strong> cela peut décaler la préparation de l’équipe.</p><p><strong>Incertitude :</strong> la disponibilité des intervenants n’est pas encore confirmée.</p><p><strong>Prochaine action :</strong> vérifier les disponibilités avec les responsables avant 16 h.</p></div><p className="mt-3 text-xs text-slate-500">Cet exemple illustre le raisonnement; il ne donne pas la réponse au cas B-104.</p></CardContent></Card>
    {!open ? <Button type="button" variant="outline" onClick={openHelp}>J’ai besoin d’aide pour rédiger</Button> : <Card className="border-amber-200 bg-amber-50/50"><CardContent className="space-y-4 p-5"><div><p className="font-semibold">Mode rédaction assistée</p><p className="mt-1 text-sm text-slate-600">Écris des idées brutes. L’application les organise sans inventer de contenu.</p></div><div className="grid gap-3 sm:grid-cols-2">{sections.map((section) => <label key={section.id} className="text-sm font-medium">{section.label}<Textarea className="mt-2 min-h-24 bg-white font-normal" value={notes[section.id]} onChange={(event) => onNote(section.id, event.target.value)} placeholder={section.prompt} /></label>)}</div><Button type="button" onClick={onOrganize} disabled={!notes.observation.trim() && !notes.uncertainty.trim() && !notes.nextAction.trim()}>Organiser mes notes dans le brouillon</Button></CardContent></Card>}
  </div>;
}

function ScenarioHeader({ definition }: { definition: ProfessionalScenarioDefinition }) {
  return (
    <Card className="border-amber-900/15 bg-gradient-to-br from-white to-amber-50/50">
      <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><Badge>TRAINING_SYNTHETIC</Badge><CardTitle className="mt-3 text-2xl">{definition.title}</CardTitle><p className="mt-2 text-sm text-slate-600">{definition.domain} · {definition.estimatedMinutes} min</p></div>
        <span className="grid size-12 place-items-center rounded-2xl bg-amber-100 text-amber-900"><BriefcaseBusiness aria-hidden="true" /></span>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-xl border border-amber-200 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">Ton rôle</p><p className="mt-2 font-semibold">{definition.role}</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Situation</p><p className="mt-2 text-sm leading-6 text-slate-700">{definition.scenarioBrief}</p></div>
      </CardContent>
    </Card>
  );
}

function SyntheticDataCard({ definition }: { definition: ProfessionalScenarioDefinition }) {
  const artifact = definition.artifacts[0];
  return (
    <Card>
      <CardHeader className="gap-2 sm:flex-row sm:items-start sm:justify-between"><div><CardTitle className="text-lg">{artifact.title}</CardTitle><p className="mt-1 text-sm text-slate-500">{artifact.description}</p></div><Badge variant="outline">{artifact.dataClassification}</Badge></CardHeader>
      <CardContent><div className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{artifact.columns.map((column) => <th key={column} className="px-4 py-3 font-semibold">{column}</th>)}</tr></thead><tbody>{artifact.rows.map((row) => <tr key={row.Batch_ID} className="border-t border-slate-200">{artifact.columns.map((column) => <td key={column} className="px-4 py-3 tabular-nums">{row[column]}</td>)}</tr>)}</tbody></table></div></CardContent>
    </Card>
  );
}

function Completion({ definition }: { definition: ProfessionalScenarioDefinition }) {
  const state = useProfessionalScenarioStore();
  const attempt = state.attempts[definition.id]!;
  const outcome = professionalScenarioOutcome(attempt, definition);
  const hints = Object.values(attempt.hintsUsed).reduce((sum, value) => sum + value, 0);
  const retries = Object.values(attempt.retries).reduce((sum, value) => sum + value, 0);
  const writingTaskId = definition.communicationTask.taskId;
  const assistanceMode = attempt.assistanceUsed?.[writingTaskId];
  return (
    <><ProfessionalScenarioRecordBridge /><div className="mx-auto max-w-4xl space-y-5"><ScenarioHeader definition={definition} />
      <Card className="border-emerald-300 bg-emerald-50/60"><CardContent className="space-y-6 p-7 sm:p-9">
        <CheckCircle2 className="size-12 text-emerald-700" aria-hidden="true" />
        <div><Badge>PRACTICED</Badge><h1 className="mt-3 text-3xl font-semibold">Situation traitée</h1><p className="mt-3 max-w-2xl leading-7 text-slate-700">Tu as produit une analyse guidée, prudente et actionnable. Ce premier scénario peut soutenir l’état Pratiquée, jamais Démontrée ou Retenue.</p></div>
        <div className="grid gap-3 sm:grid-cols-2">{definition.evaluationPolicy.dimensions.map((dimension) => <div key={dimension} className="flex items-center gap-3 rounded-xl bg-white p-4"><CheckCircle2 className="size-4 text-emerald-700" /><span className="text-sm font-medium">{dimensionLabels[dimension]}</span><Badge className="ml-auto" variant="outline">{outcome.dimensions[dimension]}</Badge></div>)}</div>
        <div className="rounded-xl bg-white p-4 text-sm text-slate-700"><strong>Aide utilisée :</strong> {hints} indice(s) · {retries} nouvel(aux) essai(s) · confiance {attempt.confidence}/5 · rédaction {assistanceLabel(assistanceMode)}</div>
        <AssistanceDisclosure value={assistanceMode} onChange={(value) => state.setAssistance(definition, writingTaskId, value)} />
        <p className="flex gap-2 text-sm text-slate-700"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-700" />La preuve, les réponses et l’historique restent sur cet appareil.</p>
        <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4"><p className="text-sm font-semibold text-cyan-950">Pont Technical English · optionnel</p><p className="mt-2 text-sm text-cyan-900">{definition.communicationTask.optionalEnglishPrompt}</p><Button asChild variant="outline" className="mt-3"><Link href="/learn/technical-english">Ouvrir le workflow audio existant<ArrowRight /></Link></Button></div>
        <div className="flex flex-wrap gap-3"><Button asChild><Link href="/evidence">Voir la preuve</Link></Button><Button variant="outline" onClick={() => state.restartWriting(definition)}><RotateCcw />Refaire uniquement le compte rendu</Button><Button variant="ghost" onClick={() => state.restart(definition)}>Recommencer tout le scénario</Button></div>
      </CardContent></Card>
    </div></>
  );
}

export function ProfessionalScenarioRuntime({ definition }: { definition: ProfessionalScenarioDefinition }) {
  const state = useProfessionalScenarioStore();
  const attempt = state.attempts[definition.id] ?? createProfessionalScenarioAttempt(definition);
  const draft = state.drafts[definition.id] ?? "";

  useEffect(() => { void hydrateProfessionalScenarioStore(definition); }, [definition]);

  if (state.startupStatus === "LOADING") return <Card><CardContent className="flex items-start gap-4 p-8"><LoaderCircle className="mt-0.5 size-6 animate-spin text-amber-700" /><div><h1 className="font-semibold">Préparation de la situation locale…</h1><p className="mt-2 text-sm text-slate-600">La définition synthétique et tes tentatives locales sont en cours de restauration.</p></div></CardContent></Card>;
  if (state.startupStatus === "RECOVERABLE_ERROR") return <Card className="border-amber-300"><CardContent className="p-8 text-center"><AlertTriangle className="mx-auto size-8 text-amber-700" /><h1 className="mt-4 text-xl font-semibold">La reprise locale n’a pas abouti</h1><p className="mt-3 text-sm text-slate-600">{state.startupError}</p><Button className="mt-5" onClick={() => void hydrateProfessionalScenarioStore(definition)}><RotateCcw />Réessayer</Button></CardContent></Card>;
  if (attempt.status === "COMPLETED") return <Completion definition={definition} />;
  if (attempt.status === "PAUSED") return <Card className="mx-auto max-w-2xl"><CardContent className="p-8 text-center"><Pause className="mx-auto size-9 text-amber-700" /><h1 className="mt-4 text-2xl font-semibold">Situation mise en pause</h1><p className="mt-2 text-slate-600">Étape, réponses et indices sont enregistrés localement.</p><div className="mt-6 flex justify-center gap-3"><Button onClick={() => state.resume(definition)}>Reprendre</Button><Button asChild variant="outline"><Link href="/learn">Retour à Apprendre</Link></Button></div></CardContent></Card>;
  if (attempt.status === "READY") return <><ProfessionalScenarioRecordBridge /><div className="mx-auto max-w-5xl space-y-5"><ScenarioHeader definition={definition} /><SyntheticDataCard definition={definition} /><Card><CardContent className="space-y-5 p-7"><h2 className="text-xl font-semibold">Mission de travail</h2><ul className="grid gap-3 text-sm text-slate-700 sm:grid-cols-3">{definition.objectives.map((objective) => <li key={objective} className="flex gap-2 rounded-xl bg-slate-50 p-4"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-amber-700" />{objective}</li>)}</ul><Button onClick={() => state.start(definition)}>Prendre en charge la situation<ArrowRight /></Button></CardContent></Card></div></>;

  const task = definition.tasks[attempt.currentTaskIndex];
  const feedback = attempt.feedback[task.id];
  const hintCount = attempt.hintsUsed[task.id] ?? 0;
  const finalTask = attempt.currentTaskIndex === definition.tasks.length - 1;
  const writingTask = task.id === definition.communicationTask.taskId;
  const assistanceMode = attempt.assistanceUsed?.[task.id];
  const writingNotes = attempt.writingNotes?.[task.id] ?? { observation: "", impact: "", uncertainty: "", nextAction: "" };
  return (
    <><ProfessionalScenarioRecordBridge /><div className="mx-auto max-w-5xl space-y-5">
      <ScenarioHeader definition={definition} />
      <SyntheticDataCard definition={definition} />
      <Card><CardContent className="space-y-6 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">{phaseLabels[task.phase as keyof typeof phaseLabels]}</p><h1 className="mt-1 text-2xl font-semibold">{task.title}</h1></div><Button variant="outline" onClick={() => state.pause(definition)}><Pause />Pause</Button></div>
        <div><div className="mb-2 flex justify-between text-xs text-slate-500"><span>Progression de la situation</span><span>{attempt.currentTaskIndex + 1}/{definition.tasks.length}</span></div><Progress value={((attempt.currentTaskIndex + 1) / definition.tasks.length) * 100} /></div>
        <p className="text-base leading-7 text-slate-700">{task.instruction}</p>
        {writingTask && <WritingScaffold notes={writingNotes} onNote={(section, value) => state.setWritingNote(definition, task.id, section, value)} onOrganize={() => state.organizeWriting(definition, task.id)} onNeedHelp={() => state.setAssistance(definition, task.id, "IN_APP_SCAFFOLD")} />}
        {task.responseType === "MULTIPLE_CHOICE" ? <div className="grid gap-3">{task.choices?.map((choice) => <Button key={choice.id} type="button" variant={draft === choice.id ? "default" : "outline"} className="h-auto justify-start whitespace-normal px-4 py-3 text-left" onClick={() => state.setDraft(definition.id, choice.id)} disabled={Boolean(feedback)}>{choice.label}</Button>)}</div> : <div><Textarea value={draft} onChange={(event) => state.setDraft(definition.id, event.target.value)} disabled={Boolean(feedback)} rows={8} className="min-h-48 bg-white" placeholder="Rédige ou adapte ton point de situation ici…" /><p className="mt-2 text-xs text-slate-500">{draft.trim().length} caractère(s) · plusieurs formulations valides sont acceptées</p></div>}
        {writingTask && <AssistanceDisclosure value={assistanceMode} onChange={(value) => state.setAssistance(definition, task.id, value)} />}
        {hintCount > 0 && <div className="space-y-2">{task.hintLevels.slice(0, hintCount).map((hint, index) => <p key={hint} className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-950"><strong>Indice {index + 1} :</strong> {hint}</p>)}</div>}
        {feedback && <div className={`rounded-xl border p-4 ${feedback.correct ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-amber-200 bg-amber-50 text-amber-950"}`}><p className="font-semibold">{feedback.correct ? "Décision validée" : "À reprendre"}</p><p className="mt-2 whitespace-pre-line text-sm leading-6">{feedback.message}</p>{Object.entries(feedback.dimensions).length > 0 && <ul className="mt-3 space-y-2 text-sm">{Object.entries(feedback.dimensions).map(([dimension, result]) => <li key={dimension}><strong>{dimensionLabels[dimension as ProfessionalEvaluationDimension]} :</strong> {result?.feedback}</li>)}</ul>}</div>}
        {feedback?.correct && finalTask && <div className="rounded-xl border border-slate-200 p-4"><p className="text-sm font-semibold">Confiance pour refaire une situation similaire sans support</p><div className="mt-3 flex flex-wrap gap-2">{[1, 2, 3, 4, 5].map((value) => <Button key={value} type="button" size="sm" variant={attempt.confidence === value ? "default" : "outline"} onClick={() => state.setConfidence(definition, value)}>{value}</Button>)}</div></div>}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5"><Button variant="ghost" onClick={() => state.showHint(definition)} disabled={hintCount >= task.hintLevels.length || Boolean(feedback?.correct)}><HelpCircle />{hintCount ? "Indice suivant" : "Besoin d’un indice ?"}</Button><div className="flex gap-3">{!feedback && <Button onClick={() => state.submit(definition)} disabled={!draft.trim() || (writingTask && !assistanceMode)}><Send />Valider</Button>}{feedback && !feedback.correct && <Button onClick={() => state.retry(definition)}><RotateCcw />Nouvel essai</Button>}{feedback?.correct && <Button onClick={() => state.continueTask(definition)} disabled={finalTask && attempt.confidence === null}>{finalTask ? "Terminer" : "Prochaine action"}<ArrowRight /></Button>}</div></div>
      </CardContent></Card>
    </div></>
  );
}
