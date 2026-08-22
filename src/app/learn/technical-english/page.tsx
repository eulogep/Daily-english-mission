import type { Metadata } from "next";
import { TechnicalEnglishBootstrap } from "@/components/technical-english/TechnicalEnglishBootstrap";
import { TechnicalEnglishWorkspace } from "@/components/technical-english/TechnicalEnglishWorkspace";

export const metadata: Metadata = { title: "Technical English" };

export default function TechnicalEnglishPage() {
  return <TechnicalEnglishBootstrap><TechnicalEnglishWorkspace /></TechnicalEnglishBootstrap>;
}
