import type { Metadata } from "next";
import { NetworkingWorkspace } from "@/components/academic-workspace/NetworkingWorkspace";

export const metadata: Metadata = { title: "Réseaux — espace académique" };
export default function NetworkingPage() { return <NetworkingWorkspace />; }

