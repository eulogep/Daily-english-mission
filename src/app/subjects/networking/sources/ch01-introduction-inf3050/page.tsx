import type { Metadata } from "next";
import { PdfSourceWorkspace } from "@/components/academic-workspace/PdfSourceWorkspace";

export const metadata: Metadata = { title: "CH01 Introduction INF3050 — source PDF" };
export default function PdfSourcePage() { return <PdfSourceWorkspace />; }

