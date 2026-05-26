"use client";

import { useState } from "react";
import { languages, text } from "@/lib/i18n";
import type { Language } from "@/lib/album";

type Props = {
  language: Language;
  onChange: (language: Language) => void;
};

export function LanguageSwitcher({ language, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const currentLanguage = languages.find((item) => item.code === language) ?? languages[0];

  function selectLanguage(nextLanguage: Language) {
    onChange(nextLanguage);
    setIsOpen(false);
  }

  return (
    <div
      className={isOpen ? "language-switcher open" : "language-switcher"}
      aria-label={text[language].language}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsOpen(false);
        }
      }}
    >
      <button
        className="language-trigger"
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`${text[language].language}: ${currentLanguage.label}`}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span aria-hidden="true">{currentLanguage.flag}</span>
      </button>

      <div className="language-menu" role="menu">
        {languages.map((item) => (
          <button
            className={item.code === language ? "language-option active" : "language-option"}
            key={item.code}
            type="button"
            role="menuitemradio"
            aria-checked={item.code === language}
            onClick={() => selectLanguage(item.code)}
          >
            <span aria-hidden="true">{item.flag}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
