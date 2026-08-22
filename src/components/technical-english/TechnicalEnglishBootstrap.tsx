"use client";

import { useEffect, type ReactNode } from "react";
import { initializeTechnicalEnglishStore } from "@/modules/technical-english/browser-store";
import { invokeTechnicalEnglishBootstrap } from "@/modules/technical-english/startup";

export function TechnicalEnglishBootstrap({ children }: { children: ReactNode }) {
  useEffect(() => {
    void invokeTechnicalEnglishBootstrap(initializeTechnicalEnglishStore);
  }, []);

  return children;
}
