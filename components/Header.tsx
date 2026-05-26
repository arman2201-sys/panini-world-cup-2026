"use client";

import Link from "next/link";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { text } from "@/lib/i18n";
import type { Language } from "@/lib/album";

type Props = {
  language: Language;
  onLanguageChange: (language: Language) => void;
  page: "admin" | "share";
};

export function Header({ language, onLanguageChange }: Props) {
  const t = text[language];

  return (
    <header className="site-header">
      <Link className="brand" href="/">
        <span className="brand-mark">🏆</span>
        <span>
          <strong>{t.appName}</strong>
          <small>{t.ownerName}</small>
        </span>
      </Link>
      <div className="header-actions">
        <LanguageSwitcher language={language} onChange={onLanguageChange} />
      </div>
    </header>
  );
}
