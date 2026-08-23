import { AlertTriangle, CheckCircle2, GitCompareArrows } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { complexDocumentPilot } from "@/modules/document-extraction/pilot-benchmark";

export function DocumentExtractionComparison() {
  return <Card>
    <CardHeader><CardTitle className="flex items-center gap-2"><GitCompareArrows className="size-5 text-cyan-700" />Comparaison d’extraction complexe</CardTitle></CardHeader>
    <CardContent className="space-y-5">
      <div className="flex flex-wrap gap-2"><Badge variant="outline">PDF.js — baseline texte</Badge><Badge>Docling — moteur complexe local</Badge><Badge variant="outline">4 pages pilotes</Badge></div>
      <div className="overflow-x-auto rounded-xl border">
        <table className="min-w-[760px] w-full text-left text-sm"><thead className="bg-slate-50"><tr><th className="p-3">Page</th><th className="p-3">Pourquoi</th><th className="p-3">PDF.js</th><th className="p-3">Docling</th><th className="p-3">Confiance</th></tr></thead><tbody>
          {complexDocumentPilot.pages.map((page) => <tr className="border-t" key={page.pageNumber}><td className="p-3 font-semibold">{page.pageNumber}</td><td className="p-3">{page.reason}</td><td className="p-3">{page.pdfjsCharacters} caractères · visuel non modélisé</td><td className="p-3">{page.doclingTextCharacters} caractères · {page.doclingPictures} figure détectée</td><td className="p-3"><Badge variant="outline">{page.doclingQuality}</Badge></td></tr>)}
        </tbody></table>
      </div>
      <div className="grid gap-3 md:grid-cols-2"><p className="flex gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900"><CheckCircle2 className="mt-0.5 size-4 shrink-0" />Docling conserve la provenance de page, les blocs, leur ordre et leur position.</p><p className="flex gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900"><AlertTriangle className="mt-0.5 size-4 shrink-0" />{complexDocumentPilot.conclusion}</p></div>
      <p className="text-xs text-slate-500">Le binaire académique reste local, ignoré par Git et n’est jamais servi au navigateur. Les résultats affichés sont des métriques dérivées du pilote.</p>
    </CardContent>
  </Card>;
}
