"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function TechnicalEnglishError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[TE] CLIENT_RUNTIME_ERROR", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
      <h1 className="text-xl font-semibold">Le module Technical English n&apos;a pas pu démarrer.</h1>
      <p className="mt-2 text-sm leading-6">Tes données locales n&apos;ont pas été effacées. Tu peux relancer uniquement ce module.</p>
      <Button type="button" className="mt-4" onClick={reset}>Réessayer</Button>
    </div>
  );
}
