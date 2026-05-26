"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { FooterNav } from "./FooterNav";
import { Header } from "./Header";
import { QRPanel } from "./QRPanel";
import { PublicStickerPicker } from "./StickerAlbumGrid";
import { StatsPanel } from "./StatsPanel";
import { useLanguage } from "./useLanguage";
import { formatStickerReferences } from "@/lib/album";
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
  const [missingSearch, setMissingSearch] = useState("");
  const [tradeSearch, setTradeSearch] = useState("");
  const [isProposalOpen, setIsProposalOpen] = useState(false);

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
  const offerSummary = useMemo(() => formatStickerReferences(hasForMe, language), [hasForMe, language]);
  const wantSummary = useMemo(() => formatStickerReferences(wantsFromMe, language), [wantsFromMe, language]);

  function toggle(setter: (stickers: number[]) => void, values: number[], sticker: number) {
    const nextValues = values.includes(sticker) ? values.filter((value) => value !== sticker) : [...values, sticker];
    setter(uniqueSorted(nextValues));
  }

  async function submitProposal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setMessage(t.nameRequired);
      return;
    }

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

  async function copyTradeRequest() {
    const requestText = buildTradeRequestText({
      title: t.submitProposal,
      nameLabel: t.proposalName,
      name,
      offersLabel: t.offers,
      offers: offerSummary,
      wantsLabel: t.wants,
      wants: wantSummary,
      totalLabel: t.totalSelected,
      total: totalSelected
    });

    await navigator.clipboard.writeText(requestText);
    setMessage(t.copiedTradeRequest);
  }

  return (
    <>
      <Header language={language} onLanguageChange={setLanguage} page="share" />
      <main className="app-shell">
        <section className="intro-band public-intro">
          <div>
            <span className="kicker">{t.publicShare}</span>
            <h1>{t.ownerName}</h1>
            <p>{t.publicIntro}</p>
          </div>
          <div className="selection-counter">
            <span>{t.totalSelected}</span>
            <strong>{totalSelected}</strong>
          </div>
        </section>

        {message ? <p className={warning || message === t.nameRequired ? "notice warning" : "notice"}>{message}</p> : null}
        {warning ? <p className="notice warning">{t.minWarning}</p> : null}

        <details className="collection-section collapsible-section">
          <summary>
            <div className="section-heading">
              <span className="kicker">{t.selectedMissing}</span>
              <h2>{t.visitorHas}</h2>
            </div>
            <span className="summary-count">{sortedMissing.length}</span>
          </summary>
          <label className="search-field">
            <span>{t.searchPlaceholder}</span>
            <input
              type="search"
              value={missingSearch}
              onChange={(event) => setMissingSearch(event.target.value)}
              placeholder={t.searchPlaceholder}
            />
          </label>
          <PublicStickerPicker
            stickers={sortedMissing}
            selected={hasForMe}
            color="missing"
            language={language}
            emptyText={t.noMissing}
            searchTerm={missingSearch}
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
          <label className="search-field">
            <span>{t.searchPlaceholder}</span>
            <input
              type="search"
              value={tradeSearch}
              onChange={(event) => setTradeSearch(event.target.value)}
              placeholder={t.searchPlaceholder}
            />
          </label>
          <PublicStickerPicker
            stickers={sortedTrade}
            selected={wantsFromMe}
            color="trade"
            language={language}
            emptyText={t.noTrade}
            searchTerm={tradeSearch}
            onToggle={(sticker) => toggle(setWantsFromMe, wantsFromMe, sticker)}
          />
        </details>

        <section className={isProposalOpen ? "panel trade-flow-panel open" : "panel trade-flow-panel"}>
          <button
            className="trade-flow-trigger"
            type="button"
            aria-expanded={isProposalOpen}
            aria-controls="trade-proposal-form"
            onClick={() => setIsProposalOpen((current) => !current)}
          >
            <span>
              <span className="kicker">{t.publicShare}</span>
              <strong>{t.submitProposal}</strong>
              <small>{t.proposalHelper}</small>
            </span>
            <span className="trade-flow-chevron" aria-hidden="true">
              ⌄
            </span>
          </button>

          <div className="trade-flow-content" id="trade-proposal-form" aria-hidden={!isProposalOpen}>
            <form className="proposal-panel" onSubmit={submitProposal} noValidate>
              <label>
                <span>{t.proposalName}</span>
                <input value={name} onChange={(event) => setName(event.target.value)} required />
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
              <div className="trade-summary">
                <h3>{t.tradeSummary}</h3>
                <dl>
                  <div>
                    <dt>{t.proposalName}</dt>
                    <dd>{name.trim() || "-"}</dd>
                  </div>
                  <div>
                    <dt>{t.offers}</dt>
                    <dd>{offerSummary || "-"}</dd>
                  </div>
                  <div>
                    <dt>{t.wants}</dt>
                    <dd>{wantSummary || "-"}</dd>
                  </div>
                  <div>
                    <dt>{t.totalSelected}</dt>
                    <dd>{totalSelected}</dd>
                  </div>
                </dl>
              </div>
              <button className="secondary-button full" type="button" onClick={copyTradeRequest} disabled={totalSelected === 0}>
                {t.copyTradeRequest}
              </button>
              <button className="primary-button full" type="submit" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? t.submitting : t.submitProposal}
              </button>
            </form>
          </div>
        </section>

        <StatsPanel state={collection} language={language} />

        <QRPanel language={language} shareUrl={shareUrl} />
        <FooterNav language={language} page="share" />
      </main>
    </>
  );
}

function buildTradeRequestText({
  title,
  nameLabel,
  name,
  offersLabel,
  offers,
  wantsLabel,
  wants,
  totalLabel,
  total
}: {
  title: string;
  nameLabel: string;
  name: string;
  offersLabel: string;
  offers: string;
  wantsLabel: string;
  wants: string;
  totalLabel: string;
  total: number;
}) {
  return [
    title,
    `${nameLabel}: ${name.trim() || "-"}`,
    `${offersLabel}: ${offers || "-"}`,
    `${wantsLabel}: ${wants || "-"}`,
    `${totalLabel}: ${total}`
  ].join("\n");
}
