"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, FileCheck2, Info, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLearningRecordStore } from "@/modules/learning-records/browser-store";
import { COMPETENCY_LABELS, COMPETENCY_SEMANTICS, type CompetencyRecord, type EvidenceRecord } from "@/modules/learning-records/types";

function dateLabel(timestamp: number) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" }).format(new Date(timestamp));
}

function EvidenceCard({ record }: { record: EvidenceRecord }) {
  const [open, setOpen] = useState(false);
  const viewed = useLearningRecordStore((state) => state.recordEvidenceViewed);
  const completed = record.evidenceType === "MISSION_COMPLETION";
  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) viewed(record.id);
  };
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Excel CSV Foundations — Niveau 1</p><CardTitle className="mt-2 text-xl">{completed ? "Mission terminée" : "Tentative en cours"}</CardTitle><p className="mt-1 text-sm text-slate-500">{dateLabel(record.createdAt)}</p></div>
        <Badge variant={completed ? "default" : "outline"}>{completed ? "Preuve guidée valide" : "Mission commencée"}</Badge>
      </CardHeader>
      <CardContent className="space-y-5">
        <div><p className="text-sm font-semibold">Compétence</p><p className="mt-1 text-sm text-slate-600">Import CSV dans Excel</p></div>
        <ul className="space-y-2 text-sm text-slate-700">
          <li className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-700" aria-hidden="true" />{completed ? "Mission terminée" : "Mission démarrée"}</li>
          <li className="flex gap-2">{record.evaluationResult.anomalyIdentification === "VALID" ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-700" aria-hidden="true" /> : <Circle className="mt-0.5 size-4 shrink-0 text-slate-300" aria-hidden="true" />}Anomalie correctement identifiée</li>
          <li className="flex gap-2">{record.artifactReference ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-700" aria-hidden="true" /> : <Circle className="mt-0.5 size-4 shrink-0 text-slate-300" aria-hidden="true" />}Artefact local enregistré</li>
          {record.artifactReference && <li className="flex gap-2 text-amber-800"><Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />Contenu de l’artefact non vérifié indépendamment</li>}
        </ul>
        <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm"><span className="font-semibold">Aide :</span> {record.assistance.hintCount} indice(s), {record.assistance.retryCount} nouvelle(s) tentative(s){record.selfEvaluation !== null ? ` · confiance déclarée ${record.selfEvaluation}/5` : ""}</div>
        <Button variant="outline" onClick={toggle}>{open ? "Masquer les détails" : "Voir la preuve"}</Button>
        {open && <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-600"><p><strong>Référence locale :</strong> {record.artifactReference?.displayName ?? "Aucun artefact"}</p><p className="mt-2"><strong>Vérification déterministe :</strong> {record.verificationStatus === "VALID" ? "valide" : record.verificationStatus.toLowerCase()}</p><p className="mt-2 text-xs">Identifiant opaque : {record.id}</p></div>}
      </CardContent>
    </Card>
  );
}

export function EvidenceWorkspace() {
  const { hydrated, evidence } = useLearningRecordStore();
  if (!hydrated) return <p className="text-sm text-slate-500">Chargement des preuves locales…</p>;
  if (evidence.length === 0) return <Card><CardContent className="grid min-h-64 place-items-center p-8 text-center"><div><FileCheck2 className="mx-auto size-10 text-slate-400" /><h1 className="mt-4 text-2xl font-semibold">Aucune preuve pour le moment</h1><p className="mt-2 text-slate-600">Une preuve apparaîtra après le démarrage de ta mission Excel.</p><Button asChild className="mt-5"><Link href="/learn/excel-csv-foundations-level-1">Voir ma mission</Link></Button></div></CardContent></Card>;
  return <div className="space-y-6"><header><p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Tes preuves locales</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Ce que tu as réellement produit</h1><p className="mt-2 text-slate-600">Chaque affirmation reste reliée à une tentative enregistrée sur cet appareil.</p></header><div className="grid gap-5">{[...evidence].reverse().map((record) => <EvidenceCard key={record.id} record={record} />)}</div></div>;
}

export function ProgressWorkspace() {
  const { hydrated, competencies, evidence, recordCompetencyExplanationViewed } = useLearningRecordStore();
  const [open, setOpen] = useState(false);
  const competency: Pick<CompetencyRecord, "competencyId" | "status" | "supportingEvidenceIds" | "rationale"> = competencies.find((record) => record.competencyId === "EXCEL_CSV_IMPORT") ?? { competencyId: "EXCEL_CSV_IMPORT", status: "NOT_SEEN", supportingEvidenceIds: [], rationale: COMPETENCY_SEMANTICS.NOT_SEEN };
  const supporting = evidence.filter((record) => competency.supportingEvidenceIds.includes(record.id));
  const toggle = () => { const next = !open; setOpen(next); if (next) recordCompetencyExplanationViewed("EXCEL_CSV_IMPORT"); };
  if (!hydrated) return <p className="text-sm text-slate-500">Chargement de la progression locale…</p>;
  return <div className="space-y-6"><header><p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Ta progression</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Une compétence expliquée par ses preuves</h1><p className="mt-2 text-slate-600">Aucun pourcentage artificiel : le statut vient uniquement de tes activités enregistrées.</p></header><Card className="border-emerald-900/15 bg-white shadow-sm"><CardHeader><p className="text-sm font-medium text-slate-500">Excel / Données</p><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle className="text-xl">Import CSV dans Excel</CardTitle><Badge>{COMPETENCY_LABELS[competency.status]}</Badge></div></CardHeader><CardContent className="space-y-4"><p className="text-sm leading-6 text-slate-600">{competency.rationale}</p><Button variant="outline" onClick={toggle}>Pourquoi ?</Button>{open && <div className="rounded-xl bg-slate-50 p-4"><p className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="size-4 text-emerald-700" />Preuves justificatives</p>{supporting.length ? <ul className="mt-3 space-y-2 text-sm text-slate-600">{supporting.map((record) => <li key={record.id}>Mission Excel CSV Foundations — {dateLabel(record.createdAt)}</li>)}</ul> : <p className="mt-2 text-sm text-slate-600">Aucune preuve significative enregistrée.</p>}</div>}</CardContent></Card></div>;
}
