"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, LockKeyhole, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveEvidenceFile } from "@/modules/mission-runtime/evidence";
import type { EvidenceMetadata } from "@/modules/mission-runtime/types";

export function EvidenceInput({ existing, disabled, onSaved }: { existing?: EvidenceMetadata; disabled: boolean; onSaved: (metadata: EvidenceMetadata) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!file) return;
    setSaving(true);
    setError(null);
    try {
      onSaved(await saveEvidenceFile(file));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "La preuve n’a pas pu être enregistrée.");
    } finally {
      setSaving(false);
    }
  }

  if (existing) return <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950"><CheckCircle2 className="size-5" aria-hidden="true" /><div><p className="text-sm font-semibold">Preuve enregistrée localement</p><p className="text-xs text-emerald-800">{existing.displayName} · {Math.ceil(existing.size / 1024)} Ko</p></div></div>;

  return <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
    <div className="flex gap-3"><LockKeyhole className="mt-0.5 size-5 shrink-0 text-emerald-700" aria-hidden="true" /><div><p className="text-sm font-semibold">Stockage sur cet appareil uniquement</p><p className="mt-1 text-xs leading-5 text-slate-600">PNG, JPEG, WebP ou XLSX · 5 Mo maximum · aucun envoi externe.</p></div></div>
    <input type="file" accept="image/png,image/jpeg,image/webp,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" disabled={disabled || saving} onChange={(event) => { setFile(event.target.files?.[0] ?? null); setError(null); }} className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:font-medium file:text-slate-800" />
    {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
    <Button type="button" onClick={save} disabled={!file || disabled || saving}>{saving ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Paperclip aria-hidden="true" />}{saving ? "Enregistrement…" : "Enregistrer la preuve"}</Button>
  </div>;
}
