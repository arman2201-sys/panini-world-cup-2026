"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Header } from "./Header";
import { QRPanel } from "./QRPanel";
import { StatsPanel } from "./StatsPanel";
import { StickerAlbumGrid } from "./StickerAlbumGrid";
import { useLanguage } from "./useLanguage";
import { formatStickerReferences, type Language } from "@/lib/album";
import { text } from "@/lib/i18n";
import { normalizeCollectionState, type CollectionState } from "@/lib/stats";

const emptyState = normalizeCollectionState();

type GoogleDiagnostics = {
  googleSheetId: string | null;
  serviceAccountEmail: string | null;
  privateKeyPresent: boolean;
  privateKeyLooksValid: boolean;
};

type TradeProposalRecord = {
  rowNumber: number;
  timestamp: string;
  name: string;
  contact: string;
  address: string;
  note: string;
  hasForMe: number[];
  wantsFromMe: number[];
  language: string;
  status: "pending" | "accepted" | "rejected";
  acceptedAt: string;
  rejectedAt: string;
};

export function AdminApp() {
  const [language, setLanguage] = useLanguage();
  const t = text[language];
  const [collection, setCollection] = useState<CollectionState>(emptyState);
  const [password, setPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [diagnostics, setDiagnostics] = useState<GoogleDiagnostics | null>(null);
  const [proposals, setProposals] = useState<TradeProposalRecord[]>([]);
  const [isLoadingProposals, setIsLoadingProposals] = useState(false);
  const [acceptingProposal, setAcceptingProposal] = useState<number | null>(null);
  const [rejectingProposal, setRejectingProposal] = useState<number | null>(null);
  const [missingSearch, setMissingSearch] = useState("");
  const [tradeSearch, setTradeSearch] = useState("");

  async function loadDiagnostics(currentPassword = password) {
    try {
      const response = await fetch("/api/diagnostics/google", {
        headers: {
          "x-admin-password": currentPassword
        },
        cache: "no-store"
      });

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as GoogleDiagnostics;
      setDiagnostics(data);
    } catch {
      setDiagnostics(null);
    }
  }

  async function loadProposals(currentPassword = password) {
    setIsLoadingProposals(true);
    try {
      const response = await fetch("/api/proposals", {
        headers: {
          "x-admin-password": currentPassword
        },
        cache: "no-store"
      });

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as { proposals?: TradeProposalRecord[] };
      setProposals(data.proposals ?? []);
    } catch {
      setProposals([]);
    } finally {
      setIsLoadingProposals(false);
    }
  }

  useEffect(() => {
    setShareUrl(`${window.location.origin}/share`);
    const storedPassword = window.sessionStorage.getItem("panini-admin-password");
    if (storedPassword) {
      setPassword(storedPassword);
      setIsUnlocked(true);
      loadDiagnostics(storedPassword);
      loadProposals(storedPassword);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      } finally {
        setIsLoading(false);
      }
    }

    loadCollection();
  }, [t.loadError, t.setupNeeded]);

  const counts = useMemo(
    () => ({
      missing: collection.missing.length,
      trade: collection.trade.length
    }),
    [collection]
  );

  function handleUnlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.sessionStorage.setItem("panini-admin-password", password);
    setIsUnlocked(true);
    loadDiagnostics(password);
    loadProposals(password);
  }

  function toggleSticker(sticker: number, mode: "missing" | "trade") {
    setCollection((current) => {
      const missing = new Set(current.missing);
      const trade = new Set(current.trade);
      const activeSet = mode === "missing" ? missing : trade;
      const otherSet = mode === "missing" ? trade : missing;

      if (activeSet.has(sticker)) {
        activeSet.delete(sticker);
      } else {
        activeSet.add(sticker);
        otherSet.delete(sticker);
      }

      return normalizeCollectionState({
        ...current,
        missing: Array.from(missing),
        trade: Array.from(trade)
      });
    });
  }

  async function saveCollection() {
    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/collection", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password
        },
        body: JSON.stringify({
          missing: collection.missing,
          trade: collection.trade
        })
      });

      if (!response.ok) {
        throw new Error("Save failed");
      }

      const saved = (await response.json()) as CollectionState;
      setCollection(normalizeCollectionState(saved));
      setMessage(t.saved);
    } catch {
      setMessage(t.saveError);
    } finally {
      setIsSaving(false);
    }
  }

  async function acceptProposal(rowNumber: number) {
    setAcceptingProposal(rowNumber);
    setMessage("");

    try {
      const response = await fetch("/api/proposals", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password
        },
        body: JSON.stringify({ rowNumber })
      });

      if (!response.ok) {
        throw new Error("Accept failed");
      }

      const data = (await response.json()) as {
        collection: CollectionState;
        proposal: TradeProposalRecord;
      };
      setCollection(normalizeCollectionState(data.collection));
      setProposals((current) =>
        current.map((proposal) => (proposal.rowNumber === rowNumber ? data.proposal : proposal))
      );
      setMessage(t.tradeAccepted);
    } catch {
      setMessage(t.saveError);
    } finally {
      setAcceptingProposal(null);
    }
  }

  async function rejectProposal(rowNumber: number) {
    setRejectingProposal(rowNumber);
    setMessage("");

    try {
      const response = await fetch("/api/proposals", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password
        },
        body: JSON.stringify({ rowNumber, action: "reject" })
      });

      if (!response.ok) {
        throw new Error("Reject failed");
      }

      const data = (await response.json()) as {
        proposal: TradeProposalRecord;
      };
      setProposals((current) =>
        current.map((proposal) => (proposal.rowNumber === rowNumber ? data.proposal : proposal))
      );
      setMessage(t.tradeRejected);
    } catch {
      setMessage(t.saveError);
    } finally {
      setRejectingProposal(null);
    }
  }

  return (
    <>
      <Header language={language} onLanguageChange={setLanguage} page="admin" />
      <main className="app-shell">
        <section className="intro-band">
          <div>
            <span className="kicker">Version 1</span>
            <h1>{t.adminTitle}</h1>
            <p>{t.fwc} · 980 {t.totalStickers} · Google Sheets</p>
          </div>
          <a className="primary-link" href="/share">
            {t.openPublic}
          </a>
        </section>

        {!isUnlocked ? (
          <section className="panel login-panel" aria-labelledby="login-title">
            <div className="section-heading">
              <span className="kicker">Admin</span>
              <h2 id="login-title">{t.adminAccess}</h2>
            </div>
            <form className="login-form" onSubmit={handleUnlock}>
              <label>
                <span>{t.password}</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
              </label>
              <button className="primary-button" type="submit">
                {t.unlock}
              </button>
            </form>
          </section>
        ) : (
          <>
            {message ? <p className="notice">{message}</p> : null}
            {isLoading ? <p className="notice">Loading...</p> : null}

            <div className="dashboard-grid">
              <StatsPanel state={collection} language={language} />
              <section className="panel action-panel">
                <div className="section-heading">
                  <span className="kicker">{t.publicShare}</span>
                  <h2>{t.save}</h2>
                </div>
                <div className="action-list">
                  <div>
                    <span>{t.missingCount}</span>
                    <strong>{counts.missing}</strong>
                  </div>
                  <div>
                    <span>{t.tradeCount}</span>
                    <strong>{counts.trade}</strong>
                  </div>
                </div>
                {diagnostics ? (
                  <div className="diagnostics-box" aria-label="Google Sheets setup">
                    <span>Google Sheets setup</span>
                    <code>Sheet ID: {diagnostics.googleSheetId || "Mangler"}</code>
                    <code>Service account: {diagnostics.serviceAccountEmail || "Mangler"}</code>
                    <code>
                      Private key:{" "}
                      {diagnostics.privateKeyPresent
                        ? diagnostics.privateKeyLooksValid
                          ? "OK"
                          : "Forkert format"
                        : "Mangler"}
                    </code>
                  </div>
                ) : null}
                <button className="primary-button full" type="button" onClick={saveCollection} disabled={isSaving}>
                  {isSaving ? t.saving : t.save}
                </button>
              </section>
            </div>

            <details className="panel proposal-admin-panel collapsible-section" open>
              <summary>
                <div className="section-heading">
                  <span className="kicker">Google Sheets</span>
                  <h2 id="proposal-admin-title">{t.tradeProposals}</h2>
                </div>
                <span className="summary-count">{proposals.length}</span>
              </summary>
              {isLoadingProposals ? <p className="empty-state">{t.loadingProposals}</p> : null}
              {!isLoadingProposals && proposals.length === 0 ? <p className="empty-state">{t.noTradeProposals}</p> : null}
              <div className="proposal-list">
                {proposals.map((proposal) => (
                  <article className="proposal-card" key={proposal.rowNumber}>
                    <div className="proposal-card-header">
                      <div>
                        <strong>{proposal.name || t.proposalName}</strong>
                        <span>{formatDate(proposal.timestamp, language)}</span>
                      </div>
                      <span className={`proposal-status ${proposal.status}`}>
                        {proposal.status === "accepted"
                          ? t.accepted
                          : proposal.status === "rejected"
                            ? t.rejected
                            : t.pending}
                      </span>
                    </div>
                    {proposal.contact ? <p className="proposal-meta">{proposal.contact}</p> : null}
                    {proposal.address ? (
                      <p className="proposal-meta">
                        <strong>{t.proposalAddress}:</strong> {proposal.address}
                      </p>
                    ) : null}
                    <dl>
                      <div>
                        <dt>{t.proposalHasForMe}</dt>
                        <dd>{formatStickerReferences(proposal.hasForMe, language) || "-"}</dd>
                      </div>
                      <div>
                        <dt>{t.proposalWantsFromMe}</dt>
                        <dd>{formatStickerReferences(proposal.wantsFromMe, language) || "-"}</dd>
                      </div>
                    </dl>
                    {proposal.note ? <p className="proposal-note">{proposal.note}</p> : null}
                    <div className="proposal-actions">
                      <button
                        className="primary-button full"
                        type="button"
                        onClick={() => acceptProposal(proposal.rowNumber)}
                        disabled={
                          proposal.status !== "pending" ||
                          acceptingProposal === proposal.rowNumber ||
                          rejectingProposal === proposal.rowNumber
                        }
                      >
                        {acceptingProposal === proposal.rowNumber ? t.acceptingTrade : t.acceptTrade}
                      </button>
                      <button
                        className="secondary-button danger full"
                        type="button"
                        onClick={() => rejectProposal(proposal.rowNumber)}
                        disabled={
                          proposal.status !== "pending" ||
                          acceptingProposal === proposal.rowNumber ||
                          rejectingProposal === proposal.rowNumber
                        }
                      >
                        {rejectingProposal === proposal.rowNumber ? t.rejectingTrade : t.rejectTrade}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </details>

            <details className="collection-section collapsible-section">
              <summary>
                <div className="section-heading">
                  <span className="kicker">{t.selectedMissing}</span>
                  <h2>{t.missing}</h2>
                </div>
                <span className="summary-count">{counts.missing}</span>
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
              <StickerAlbumGrid
                mode="missing"
                state={collection}
                language={language}
                searchTerm={missingSearch}
                onToggle={toggleSticker}
              />
            </details>

            <details className="collection-section collapsible-section">
              <summary>
                <div className="section-heading">
                  <span className="kicker">{t.selectedTrade}</span>
                  <h2>{t.trade}</h2>
                </div>
                <span className="summary-count">{counts.trade}</span>
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
              <StickerAlbumGrid
                mode="trade"
                state={collection}
                language={language}
                searchTerm={tradeSearch}
                onToggle={toggleSticker}
              />
            </details>

            <QRPanel language={language} shareUrl={shareUrl} />
          </>
        )}
      </main>
    </>
  );
}

function formatDate(value: string, language: Language) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const locale = language === "da" ? "da-DK" : language === "bs" ? "bs-BA" : "en-GB";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short"
  }).format(date);
}
