import Link from "next/link";
import { BookOpen, ExternalLink, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { sourceCanBeUsedExternally } from "@/modules/source-engine/core";
import { sourceEngineRegistry } from "@/modules/source-engine/pilot-registry";

export function MissionSourcesCard({ sourceBundleIds }: { sourceBundleIds: string[] }) {
  const bundles = sourceEngineRegistry.bundles.filter((bundle) => sourceBundleIds.includes(bundle.id));
  if (!bundles.length) return null;
  return <details className="rounded-xl border border-slate-200 bg-white shadow-sm"><summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 font-semibold"><BookOpen className="size-5 text-emerald-700" />Sources utilisées pour cette mission<Badge className="ml-auto" variant="outline">{bundles.reduce((count, bundle) => count + bundle.sourceIds.length, 0)}</Badge></summary><div className="space-y-4 border-t border-slate-200 p-5">{bundles.map((bundle) => <div key={bundle.id}><p className="font-semibold">{bundle.title}</p><p className="mt-1 text-sm text-slate-600">{bundle.purpose}</p><ul className="mt-3 space-y-2">{bundle.sourceIds.map((id) => {
    const source = sourceEngineRegistry.sources.find((item) => item.id === id)!;
    return <li key={id} className="rounded-lg bg-slate-50 p-3 text-sm"><div className="flex flex-wrap items-center gap-2"><strong>{source.title}</strong><Badge variant="outline">{source.sourceType}</Badge>{!sourceCanBeUsedExternally(source) && <span className="flex items-center gap-1 text-xs text-amber-800"><ShieldAlert className="size-3.5" />usage local</span>}</div><p className="mt-1 text-slate-600">{source.origin} · {source.trust.verification}</p></li>;
  })}</ul></div>)}<Link className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 underline" href="/sources">Explorer la provenance complète<ExternalLink className="size-4" /></Link></div></details>;
}
