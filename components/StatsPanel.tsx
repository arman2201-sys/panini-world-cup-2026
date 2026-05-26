"use client";

import { calculateStats, type CollectionState } from "@/lib/stats";
import { stickerGroupLabel, type Language } from "@/lib/album";
import { text } from "@/lib/i18n";

type Props = {
  state: CollectionState;
  language: Language;
};

export function StatsPanel({ state, language }: Props) {
  const t = text[language];
  const stats = calculateStats(state);

  return (
    <section className="panel stats-panel" aria-labelledby="stats-title">
      <div className="section-heading">
        <span className="kicker">{t.stats}</span>
        <h2 id="stats-title">{t.albumProgress}</h2>
      </div>

      <div className="progress-hero">
        <div>
          <span className="progress-number">{stats.progress}%</span>
          <p>
            {stats.collectedCount} / {stats.total}
          </p>
          <small>{t.lastUpdated}: {state.updatedAt ? formatDate(state.updatedAt, language) : t.notRecorded}</small>
        </div>
        <div className="progress-track" aria-label={`${t.albumProgress}: ${stats.progress}%`}>
          <span style={{ width: `${stats.progress}%` }} />
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label={t.missingCount} value={stats.missingCount} tone="red" />
        <StatCard label={t.tradeCount} value={stats.tradeCount} tone="green" />
        <StatCard label={t.collectedCount} value={stats.collectedCount} tone="blue" />
        <StatCard
          label={t.bestGroup}
          value={`${stickerGroupLabel(stats.bestGroup.letter, language)} · ${stats.bestGroup.progress}%`}
          tone="gold"
        />
      </div>

      <div className="group-progress">
        <h3>{t.groupProgress}</h3>
        <div className="mini-bars">
          <MiniBar label="FWC" value={stats.fwcProgress} />
          {stats.groupProgress.map((group) => (
            <MiniBar key={group.id} label={stickerGroupLabel(group.letter, language)} value={group.progress} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number | string; tone: string }) {
  return (
    <div className={`stat-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function MiniBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="mini-bar">
      <span>{label}</span>
      <div>
        <i style={{ width: `${value}%` }} />
      </div>
      <b>{value}%</b>
    </div>
  );
}

function formatDate(value: string, language: Language) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const locale = language === "da" ? "da-DK" : language === "bs" ? "bs-BA" : "en-GB";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}
