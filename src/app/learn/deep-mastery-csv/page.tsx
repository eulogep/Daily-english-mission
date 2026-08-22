import type { Metadata } from "next";
import { DeepMasteryRuntime } from "@/components/deep-mastery/DeepMasteryRuntime";
import { csvDelimiterMastery } from "@/modules/deep-mastery/csv-delimiter-definition";

export const metadata: Metadata = { title: "Maîtrise profonde · CSV" };

export default function DeepMasteryCsvPage() {
  return <DeepMasteryRuntime definition={csvDelimiterMastery} />;
}
