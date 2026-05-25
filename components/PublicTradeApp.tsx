"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Header } from "./Header";
import { QRPanel } from "./QRPanel";
import { PublicStickerPicker } from "./StickerAlbumGrid";
import { StatsPanel } from "./StatsPanel";
import { useLanguage } from "./useLanguage";
import { text } from "@/lib/i18n";
import { normalizeCollectionState, uniqueSorted, type CollectionState } from "@/lib/stats";

const emptyState = normalizeCollectionState();

export function PublicTradeApp() {
  const [language, setLanguage] = useLanguage();
  const t = text[language];
  const [collection, setCollection] = useState<CollectionState>(emptyState);
  const [hasForMe, setHasForMe] = useState<number[]>([]);
  const [wantsFromMe, setWantsFromMe] = useState<number[]>([]);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    setShareUrl(window.location.href);
  }, []);

  useEffect(() => {
    async function loadCollection() {
      try {
        const response = await fetch("/api/collection", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Load failed");
        }
        const data = (await response.json()) as CollectionState;
        setCollection(normalizeCollectionState(data));
        if (data.setupRequired) {
          setMessage(t.setupNeeded);
        }
      } catch {
        setMessage(t.loadError);
      }
    }

    loadCollection();
  }, [t.loadError, t.setupNeeded]);

  const totalSelected = hasForMe.length + wantsFromMe.length;
  const canSubmit = totalSelected >= 5;
  const warning = totalSelected < 5;

  const sortedMissing = useMemo(() => uniqueSorted(collection.missing), [collection.missing]);
  const sortedTrade = useMemo(() => uniqueSorted(collection.trade), [collection.trade]);

  function toggle(setter: (stickers: number[]) => void, values: number[], sticker: number) {
    const nextValues = values.includes(sticker) ? values.filter((value) => value !== sticker) : [...values, sticker];
    setter(uniqueSorted(nextValues));
  }

  async function submitProposal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      setMessage(t.minWarning);
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          contact,
          address,
          note,
          hasForMe,
          wantsFromMe,
          language
        })
      });

      if (!response.ok) {
        throw new Error("Submit failed");
      }

      setHasForMe([]);
      setWantsFromMe([]);
      setName("");
      setContact("");
      setAddress("");
      setNote("");
      setMessage(t.proposalSent);
    } catch {
      setMessage(t.saveError);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Header language={language} onLanguageChange={setLanguage} page="share" />
      <main className="app-shell">
        <section className="intro-band public-intro">
          <div>
            <span className="kicker">{t.readonly}</span>
            <h1>{t.publicTitle}</h1>
            <p>{t.publicIntro}</p>
          </div>
          <div className="selection-counter">
            <span>{t.totalSelected}</span>
            <strong>{totalSelected}</strong>
          </div>
        </section>

        {message ? <p className={warning ? "notice warning" : "notice"}>{message}</p> : null}
        {warning ? <p className="notice warning">{t.minWarning}</p> : null}

        <div className="dashboard-grid">
          <StatsPanel state={collection} language={language} />
          <form className="panel proposal-panel" onSubmit={submitProposal}>
            <div className="section-heading">
              <span className="kicker">{t.publicTitle}</span>
              <h2>{t.submitProposal}</h2>
            </div>
            <label>
              <span>{t.proposalName}</span>
              <input value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label>
              <span>{t.proposalContact}</span>
              <input value={contact} onChange={(event) => setContact(event.target.value)} />
            </label>
            <label>
              <span>{t.proposalAddress}</span>
              <input value={address} onChange={(event) => setAddress(event.target.value)} />
            </label>
            <label>
              <span>{t.proposalNote}</span>
              <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={4} />
            </label>
            <button className="primary-button full" type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? t.submitting : t.submitProposal}
            </button>
          </form>
        </div>

        <details className="collection-section collapsible-section">
          <summary>
            <div className="section-heading">
              <span className="kicker">{t.selectedMissing}</span>
              <h2>{t.visitorHas}</h2>
            </div>
            <span className="summary-count">{sortedMissing.length}</span>
          </summary>
          <PublicStickerPicker
            stickers={sortedMissing}
            selected={hasForMe}
            color="missing"
            language={language}
            emptyText={t.noMissing}
            onToggle={(sticker) => toggle(setHasForMe, hasForMe, sticker)}
          />
        </details>

        <details className="collection-section collapsible-section">
          <summary>
            <div className="section-heading">
              <span className="kicker">{t.selectedTrade}</span>
              <h2>{t.visitorWants}</h2>
            </div>
            <span className="summary-count">{sortedTrade.length}</span>
          </summary>
          <PublicStickerPicker
            stickers={sortedTrade}
            selected={wantsFromMe}
            color="trade"
            language={language}
            emptyText={t.noTrade}
            onToggle={(sticker) => toggle(setWantsFromMe, wantsFromMe, sticker)}
          />
        </details>

        <QRPanel language={language} shareUrl={shareUrl} />
      </main>
    </>
  );
}
