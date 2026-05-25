"use client";

import type { Language } from "@/lib/album";
import { text } from "@/lib/i18n";

type Props = {
  language: Language;
  shareUrl: string;
};

export function QRPanel({ language, shareUrl }: Props) {
  const t = text[language];
  const qrUrl = shareUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(shareUrl)}`
    : "";

  if (!shareUrl) {
    return null;
  }

  return (
    <section className="panel qr-panel" aria-labelledby="qr-title">
      <div>
        <span className="kicker">{t.publicShare}</span>
        <h2 id="qr-title">{t.qr}</h2>
        <a href={shareUrl}>{shareUrl}</a>
      </div>
      <img className="qr-code" src={qrUrl} alt={t.qr} />
    </section>
  );
}
