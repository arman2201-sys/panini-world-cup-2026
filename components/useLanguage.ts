"use client";

import { useEffect, useState } from "react";
import type { Language } from "@/lib/album";

export function useLanguage() {
  const [language, setLanguage] = useState<Language>("da");

  useEffect(() => {
    const stored = window.localStorage.getItem("panini-language");
    if (stored === "da" || stored === "bs") {
      setLanguage(stored);
    }
  }, []);

  function updateLanguage(nextLanguage: Language) {
    setLanguage(nextLanguage);
    window.localStorage.setItem("panini-language", nextLanguage);
  }

  return [language, updateLanguage] as const;
}
