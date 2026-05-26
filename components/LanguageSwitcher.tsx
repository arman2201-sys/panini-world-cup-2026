"use client";

import { languages, text } from "@/lib/i18n";
import type { Language } from "@/lib/album";

type Props = {
  language: Language;
  onChange: (language: Language) => void;
};

export function LanguageSwitcher({ language, onChange }: Props) {
  return (
    <div className="language-switcher" aria-label={text[language].language}>
      {languages.map((item, index) => (
        <span className="language-item" key={item.code}>
          <button
            className={item.code === language ? "language-button active" : "language-button"}
            type="button"
            onClick={() => onChange(item.code)}
            aria-pressed={item.code === language}
          >
            <span aria-hidden="true">{item.flag}</span>
            <span>{item.label}</span>
          </button>
          {index < languages.length - 1 ? <span className="language-divider">|</span> : null}
        </span>
      ))}
    </div>
  );
}
