import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type DeferredWorkspaceProps = {
  eyebrow: string;
  title: string;
  description: string;
  actionLabel: string;
  actionHref?: string;
  icon: LucideIcon;
};

export function DeferredWorkspace({ eyebrow, title, description, actionLabel, actionHref = "/", icon: Icon }: DeferredWorkspaceProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">{eyebrow}</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
        <p className="max-w-2xl text-base leading-7 text-slate-600">{description}</p>
      </header>
      <Card className="border-slate-200/80 bg-gradient-to-br from-white to-emerald-50/40 shadow-sm transition-shadow hover:shadow-md">
        <CardContent className="flex flex-col items-start gap-5 p-7 sm:flex-row sm:items-center">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-800"><Icon className="size-6" aria-hidden="true" /></span>
          <div className="flex-1 space-y-2">
            <h2 className="text-lg font-semibold text-slate-950">Ton espace se construit avec tes activités</h2>
            <p className="text-sm leading-6 text-slate-600">Commence une mission : ce contenu s’enrichira naturellement avec ton travail.</p>
          </div>
          <Button asChild><Link href={actionHref}>{actionLabel}<ArrowRight aria-hidden="true" /></Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}
