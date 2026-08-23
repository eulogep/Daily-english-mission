"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookCopy, CheckCircle2, FileText, GitBranch, Info, LibraryBig, Search, ShieldAlert, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { filterSources, sourceCanBeUsedExternally } from "@/modules/source-engine/core";
import type { SourceEngineRegistry, SourceRecord } from "@/modules/source-engine/types";

const verificationLabels = { VERIFIED: "Vérifiée", PARTIAL: "Partiellement vérifiée", UNVERIFIED: "Non vérifiée" } as const;
const authorityLabels = { OFFICIAL: "Officielle", ESTABLISHED: "Établie", COMMUNITY: "Communautaire", UNKNOWN: "Inconnue" } as const;
const freshnessLabels = { CURRENT: "Actuelle", POSSIBLY_OUTDATED: "Possiblement datée", HISTORICAL: "Historique", UNKNOWN: "Inconnue" } as const;
const rightsLabels = { KNOWN: "Connus", UNKNOWN: "Inconnus", RESTRICTED: "Restreints" } as const;
const supportLabels = { SUPPORTED: "Enseigné", PARTIALLY_SUPPORTED: "Partiellement enseigné", MENTIONED: "Mentionné", INFERRED: "Relié par inférence" } as const;

function SourceCard({ source, registry }: { source: SourceRecord; registry: SourceEngineRegistry }) {
  const relations = registry.relations.filter((relation) => relation.sourceId === source.id);
  const concepts = registry.concepts.filter((concept) => source.conceptIds.includes(concept.id));
  const artifacts = registry.derivedArtifacts.filter((artifact) => artifact.sourceIds.includes(source.id));
  const safeExternal = sourceCanBeUsedExternally(source);
  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Source originale · canonique</p><CardTitle className="mt-2 text-xl">{source.title}</CardTitle><p className="mt-2 text-sm text-slate-500">{source.sourceType} · {source.subject} · {source.origin}</p></div>
        <Badge variant={source.trust.verification === "VERIFIED" ? "default" : "outline"}>{verificationLabels[source.trust.verification]}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6 text-slate-700">{source.notes[0]}</p>
        <div className="flex flex-wrap gap-2">{concepts.map((concept) => <Badge key={concept.id} variant="outline">{concept.name}</Badge>)}</div>
        <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <summary className="cursor-pointer text-sm font-semibold">Inspecter la source et sa provenance</summary>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="font-semibold">Autorité</dt><dd className="text-slate-600">{authorityLabels[source.trust.authority]}</dd></div>
            <div><dt className="font-semibold">Actualité</dt><dd className="text-slate-600">{freshnessLabels[source.freshness]}</dd></div>
            <div><dt className="font-semibold">Droits / copyright</dt><dd className="text-slate-600">{rightsLabels[source.copyrightStatus]}</dd></div>
            <div><dt className="font-semibold">Licence</dt><dd className="text-slate-600">{rightsLabels[source.licenseStatus]}</dd></div>
            <div><dt className="font-semibold">Classification</dt><dd className="text-slate-600">{source.classification}</dd></div>
            <div><dt className="font-semibold">Statut</dt><dd className="text-slate-600">{source.status}</dd></div>
            <div><dt className="font-semibold">Usage externe</dt><dd className={safeExternal ? "text-emerald-700" : "text-amber-800"}>{safeExternal ? "Autorisé par les métadonnées" : "Bloqué sans validation complémentaire"}</dd></div>
          </dl>
          <div className="mt-4 space-y-2 text-sm">
            <p><strong>Référence originale :</strong> {source.originalPathOrReference?.startsWith("/") ? <Link className="text-emerald-800 underline" href={source.originalPathOrReference}>Ouvrir la source</Link> : source.originalPathOrReference ?? "Non disponible"}</p>
            <p><strong>Champs extraits :</strong> {source.provenance.extractedFields.join(", ") || "Aucun"}</p>
            <p><strong>Champs inférés :</strong> {source.provenance.inferredFields.join(", ") || "Aucun"}</p>
            <p><strong>Missions liées :</strong> {source.missionIds.length ? source.missionIds.join(", ") : "aucune"}</p>
          </div>
          {relations.length > 0 && <div className="mt-4"><p className="text-sm font-semibold">Relation source → concept</p><ul className="mt-2 space-y-2">{relations.map((relation) => {
            const concept = registry.concepts.find((item) => item.id === relation.conceptId);
            return <li key={`${relation.sourceId}:${relation.conceptId}`} className="rounded-lg bg-white p-3 text-sm"><strong>{concept?.name}</strong> · {supportLabels[relation.support]}<span className="mt-1 block text-slate-600">{relation.rationale}</span></li>;
          })}</ul></div>}
          {artifacts.length > 0 && <p className="mt-4 text-sm"><strong>Matériaux dérivés :</strong> {artifacts.map((artifact) => artifact.title).join(", ")}</p>}
        </details>
      </CardContent>
    </Card>
  );
}

export function SourceExplorer({ registry }: { registry: SourceEngineRegistry }) {
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("");
  const [sourceType, setSourceType] = useState("");
  const [conceptId, setConceptId] = useState("");
  const subjects = [...new Set(registry.sources.map((source) => source.subject))].sort();
  const sourceTypes = [...new Set(registry.sources.map((source) => source.sourceType))].sort();
  const sources = useMemo(() => filterSources(registry.sources, { query, subject, sourceType, conceptId }), [conceptId, query, registry.sources, sourceType, subject]);
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-emerald-800"><LibraryBig className="size-5" /><span className="text-xs font-semibold uppercase tracking-[0.2em]">Knowledge / Sources</span></div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Comprendre d’où vient ce que tu apprends</h1>
        <p className="max-w-3xl leading-7 text-slate-600">Les sources originales restent canoniques. Les missions, résumés et autres supports générés sont affichés séparément comme matériaux dérivés.</p>
      </header>

      <Card><CardContent className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-[1fr_210px_170px_210px]">
        <label className="relative"><Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-slate-400" /><span className="sr-only">Rechercher</span><Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Titre, tag, origine…" /></label>
        <label><span className="sr-only">Matière</span><select className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" value={subject} onChange={(event) => setSubject(event.target.value)}><option value="">Toutes les matières</option>{subjects.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label><span className="sr-only">Type</span><select className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" value={sourceType} onChange={(event) => setSourceType(event.target.value)}><option value="">Tous les types</option>{sourceTypes.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label><span className="sr-only">Concept</span><select className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" value={conceptId} onChange={(event) => setConceptId(event.target.value)}><option value="">Tous les concepts</option>{registry.concepts.map((concept) => <option key={concept.id} value={concept.id}>{concept.name}</option>)}</select></label>
      </CardContent></Card>

      <section className="space-y-4"><div className="flex items-center justify-between"><h2 className="text-2xl font-semibold">Sources canoniques</h2><Badge variant="outline">{sources.length} résultat(s)</Badge></div><div className="grid gap-5">{sources.map((source) => <SourceCard key={source.id} source={source} registry={registry} />)}</div>{sources.length === 0 && <p className="rounded-xl border border-dashed p-6 text-sm text-slate-600">Aucune source ne correspond à ces filtres.</p>}</section>

      <section className="space-y-4"><h2 className="text-2xl font-semibold">Concepts reliés</h2><div className="grid gap-4 md:grid-cols-2">{registry.concepts.map((concept) => <Card key={concept.id}><CardContent className="p-5"><p className="font-semibold">{concept.name}</p><p className="mt-2 text-sm text-slate-600">{concept.description}</p><p className="mt-3 text-xs text-slate-500">Prérequis : {concept.prerequisiteConceptIds.length ? concept.prerequisiteConceptIds.map((id) => registry.concepts.find((item) => item.id === id)?.name ?? id).join(", ") : "aucun"}</p></CardContent></Card>)}</div></section>

      <section className="space-y-4"><div className="flex items-center gap-2"><BookCopy className="size-5 text-cyan-800" /><h2 className="text-2xl font-semibold">Matériaux dérivés</h2></div>{registry.derivedArtifacts.map((artifact) => <Card key={artifact.id} className="border-cyan-200 bg-cyan-50/40"><CardContent className="p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><Badge variant="outline">DÉRIVÉ · NON CANONIQUE</Badge><p className="mt-3 font-semibold">{artifact.title}</p></div><GitBranch className="size-6 text-cyan-800" /></div><p className="mt-3 text-sm text-slate-600">Méthode : {artifact.generationMethod} · Vérification : {artifact.verificationStatus}</p><p className="mt-2 text-sm text-slate-600">Dérivé de : {artifact.sourceIds.map((id) => registry.sources.find((source) => source.id === id)?.title ?? id).join(", ")}</p></CardContent></Card>)}</section>

      <section className="space-y-4"><h2 className="text-2xl font-semibold">Bundles contrôlés</h2>{registry.bundles.map((bundle) => {
        const blocked = bundle.sourceIds.filter((id) => !sourceCanBeUsedExternally(registry.sources.find((source) => source.id === id)!));
        const missions = registry.missionLinks.filter((link) => link.sourceBundleIds.includes(bundle.id)).map((link) => link.missionId);
        return <Card key={bundle.id} className="border-emerald-900/15"><CardContent className="space-y-4 p-5"><div><Badge>Source bundle</Badge><p className="mt-3 text-xl font-semibold">{bundle.title}</p><p className="mt-2 text-sm text-slate-600">{bundle.purpose}</p></div><p className="flex gap-2 text-sm"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-700" />Mission liée : {missions.join(", ")}</p><p className="flex gap-2 text-sm"><FileText className="mt-0.5 size-4 shrink-0 text-slate-500" />{bundle.sourceIds.length} source(s), {bundle.derivedArtifactIds.length} dérivé(s)</p><p className="flex gap-2 text-sm text-amber-800">{blocked.length ? <ShieldAlert className="mt-0.5 size-4 shrink-0" /> : <ShieldCheck className="mt-0.5 size-4 shrink-0" />}{blocked.length ? `${blocked.length} source(s) bloquée(s) pour tout transfert externe automatique` : "Sources autorisées pour l’usage prévu"}</p><p className="flex gap-2 text-xs text-slate-500"><Info className="size-4 shrink-0" />Compatible avec une future tâche NotebookLM contrôlée; aucune automatisation n’est active.</p></CardContent></Card>;
      })}</section>
    </div>
  );
}
