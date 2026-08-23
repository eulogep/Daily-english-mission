import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { potentialAcademicSources } from "@/modules/academic-workspace/extractor-registry";

export function PotentialAcademicSourcesCard() {
  return <Card><CardHeader><CardTitle>Sources académiques potentielles</CardTitle></CardHeader><CardContent className="space-y-3">
    <p className="text-sm text-slate-600">Aperçu de métadonnées uniquement. Aucun traitement en masse n’est lancé.</p>
    <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead><tr className="border-b"><th className="p-2">Fichier</th><th className="p-2">Type</th><th className="p-2">Matière possible</th><th className="p-2">Extraction</th><th className="p-2">État</th></tr></thead><tbody>{potentialAcademicSources.map((source) => <tr key={source.fileName} className="border-b last:border-0"><td className="p-2 font-medium">{source.fileName}</td><td className="p-2">{source.format}</td><td className="p-2">{source.possibleSubject}</td><td className="p-2">{source.extractionSupport}</td><td className="p-2"><Badge variant="outline">{source.status}</Badge></td></tr>)}</tbody></table></div>
  </CardContent></Card>;
}
