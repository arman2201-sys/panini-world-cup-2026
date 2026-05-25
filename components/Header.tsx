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

export function Header({ language, onLanguageChange, page }: Props) {
  const t = text[language];

  return (
    <header className="site-header">
      <Link className="brand" href="/">
        <span className="brand-mark">🏆</span>
        <span>
          <strong>{t.appName}</strong>
          <small>{page === "admin" ? t.adminTitle : t.publicTitle}</small>
        </span>
      </Link>
      <div className="header-actions">
        <nav className="header-nav" aria-label="Navigation">
          <Link className={page === "admin" ? "nav-link active" : "nav-link"} href="/">
            Admin
          </Link>
          <Link className={page === "share" ? "nav-link active" : "nav-link"} href="/share">
            Share
          </Link>
        </nav>
        <LanguageSwitcher language={language} onChange={onLanguageChange} />
      </div>
    </header>
  );
}
