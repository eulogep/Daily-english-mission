import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MissionRuntime } from "@/components/mission-runtime/MissionRuntime";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Mission découverte" };
export default function RuntimeDemoPage() {
  return <div className="space-y-6"><Button asChild variant="ghost" className="-ml-3"><Link href="/learn"><ArrowLeft aria-hidden="true" />Retour aux missions</Link></Button><MissionRuntime /></div>;
}
