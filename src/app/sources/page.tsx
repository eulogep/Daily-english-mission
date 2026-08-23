import type { Metadata } from "next";
import { SourceExplorer } from "@/components/source-engine/SourceExplorer";
import { sourceEngineRegistry } from "@/modules/source-engine/pilot-registry";

export const metadata: Metadata = { title: "Knowledge / Sources" };

export default function SourcesPage() {
  return <SourceExplorer registry={sourceEngineRegistry} />;
}
