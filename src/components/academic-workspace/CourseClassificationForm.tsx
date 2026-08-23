"use client";

import { useState } from "react";
import { FilePlus2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { validateCourseClassification } from "@/modules/academic-workspace/core";
import type { CourseClassificationDraft, CourseFormat } from "@/modules/academic-workspace/types";

const extensionFormat = (name: string): CourseFormat => {
  const extension = name.split(".").at(-1)?.toLowerCase();
  if (extension === "pdf") return "PDF";
  if (extension === "docx") return "DOCX";
  if (extension === "md") return "MARKDOWN";
  if (extension === "csv") return "CSV";
  return "TEXT";
};

export function CourseClassificationForm() {
  const [draft, setDraft] = useState<CourseClassificationDraft>({ fileName: "", format: "PDF", subjectId: "SUBJECT-NETWORKING", moduleId: "MODULE-NETWORK-FUNDAMENTALS", classification: "ACADEMIC_PERSONAL_USE", language: "fr", copyrightStatus: "UNKNOWN" });
  const [result, setResult] = useState<string | null>(null);
  const validation = validateCourseClassification(draft);
  return <Card>
    <CardHeader><CardTitle className="flex items-center gap-2"><FilePlus2 className="size-5 text-emerald-700" />Cataloguer un cours local</CardTitle></CardHeader>
    <CardContent className="space-y-4">
      <p className="text-sm leading-6 text-slate-600">Le navigateur ne lit ni ne transfère le contenu. Cette étape prépare uniquement sa classification locale avant toute ingestion.</p>
      <label className="block text-sm font-medium">Fichier local
        <input className="mt-2 block w-full rounded-lg border border-slate-300 p-2" type="file" accept=".pdf,.docx,.md,.txt,.csv" onChange={(event) => { const file = event.target.files?.[0]; if (file) setDraft((prior) => ({ ...prior, fileName: file.name, format: extensionFormat(file.name) })); }} />
      </label>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm font-medium">Classification
          <select className="mt-2 w-full rounded-lg border border-slate-300 p-2" value={draft.classification} onChange={(event) => setDraft((prior) => ({ ...prior, classification: event.target.value as CourseClassificationDraft["classification"] }))}>
            <option value="ACADEMIC_PERSONAL_USE">Cours — usage personnel</option><option value="PUBLIC">Public</option><option value="PERSONAL">Personnel</option><option value="UNKNOWN">Inconnue — bloquante</option>
          </select>
        </label>
        <label className="text-sm font-medium">Langue<input className="mt-2 w-full rounded-lg border border-slate-300 p-2" value={draft.language} onChange={(event) => setDraft((prior) => ({ ...prior, language: event.target.value }))} /></label>
        <label className="text-sm font-medium">Droits
          <select className="mt-2 w-full rounded-lg border border-slate-300 p-2" value={draft.copyrightStatus} onChange={(event) => setDraft((prior) => ({ ...prior, copyrightStatus: event.target.value as CourseClassificationDraft["copyrightStatus"] }))}><option value="UNKNOWN">Inconnus</option><option value="KNOWN">Connus</option><option value="RESTRICTED">Restreints</option></select>
        </label>
      </div>
      {!validation.valid && draft.fileName && <div className="flex gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900"><ShieldAlert className="size-4 shrink-0" />{validation.errors.join(" ")}</div>}
      <Button disabled={!validation.valid} onClick={() => setResult(`${draft.fileName} — métadonnée prête localement; aucun contenu lu ni envoyé.`)}>Valider la classification</Button>
      {result && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">{result}</p>}
    </CardContent>
  </Card>;
}

