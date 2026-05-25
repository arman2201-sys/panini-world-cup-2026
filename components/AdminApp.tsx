"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Header } from "./Header";
import { StatsPanel } from "./StatsPanel";
import { StickerAlbumGrid } from "./StickerAlbumGrid";
import { useLanguage } from "./useLanguage";
import { text } from "@/lib/i18n";
import { normalizeCollectionState, type CollectionState } from "@/lib/stats";

const emptyState = normalizeCollectionState();

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

  useEffect(() => {
    setShareUrl(`${window.location.origin}/share`);
    const storedPassword = window.sessionStorage.getItem("panini-admin-password");
    if (storedPassword) {
      setPassword(storedPassword);
      setIsUnlocked(true);
    }
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

  return (
    <>
      <Header language={language} onLanguageChange={setLanguage} page="admin" />
      <main className="app-shell">
        <section className="intro-band">
          <div>
            <span className="kicker">Version 1</span>
            <h1>{t.adminTitle}</h1>
            <p>{t.fwc} · 980 stickers · Google Sheets</p>
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
              <StatsPanel state={collection} language={language} shareUrl={shareUrl} />
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
                <button className="primary-button full" type="button" onClick={saveCollection} disabled={isSaving}>
                  {isSaving ? t.saving : t.save}
                </button>
              </section>
            </div>

            <section className="collection-section">
              <div className="section-heading">
                <span className="kicker">{t.selectedMissing}</span>
                <h2>{t.missing}</h2>
              </div>
              <StickerAlbumGrid mode="missing" state={collection} language={language} onToggle={toggleSticker} />
            </section>

            <section className="collection-section">
              <div className="section-heading">
                <span className="kicker">{t.selectedTrade}</span>
                <h2>{t.trade}</h2>
              </div>
              <StickerAlbumGrid mode="trade" state={collection} language={language} onToggle={toggleSticker} />
            </section>
          </>
        )}
      </main>
    </>
  );
}
