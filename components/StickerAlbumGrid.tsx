"use client";

import type { ReactNode } from "react";
import { fwcRange, groups, range, stickerGroupLabel, stickerMatchesSearch, type Language, type Team } from "@/lib/album";
import { text } from "@/lib/i18n";
import { getStickerStatus, type CollectionState, type StickerStatus } from "@/lib/stats";

type StickerVisualStatus = StickerStatus | "unselected";

type AdminGridProps = {
  mode: "missing" | "trade";
  state: CollectionState;
  language: Language;
  searchTerm?: string;
  onToggle: (sticker: number, mode: "missing" | "trade") => void;
};

type PublicGridProps = {
  stickers: number[];
  selected: number[];
  color: "missing" | "trade";
  language: Language;
  emptyText: string;
  searchTerm?: string;
  onToggle: (sticker: number) => void;
};

export function StickerAlbumGrid({ mode, state, language, searchTerm = "", onToggle }: AdminGridProps) {
  const t = text[language];
  const query = searchTerm.trim();
  const shouldOpen = Boolean(query);
  const fwcStickers = range(fwcRange.start, fwcRange.end).filter((sticker) =>
    stickerMatchesSearch(sticker, query, language)
  );

  return (
    <div className={`album-grid ${mode}`}>
      {fwcStickers.length > 0 ? (
        <details className="group-block accordion-group fwc-group" open={shouldOpen || undefined}>
          <summary>
            <h3>{t.fwc}</h3>
            <span className="summary-count">{fwcStickers.length}</span>
          </summary>
          <StickerRangeBlock
            title={t.fwc}
            stickers={fwcStickers}
            getStatus={(sticker) => getStickerStatus(state, sticker)}
            onClick={(sticker) => onToggle(sticker, mode)}
            compact
          />
        </details>
      ) : null}

      {groups.map((group) => {
        const teamsWithStickers = group.teams
          .map((team) => ({
            team,
            stickers: range(team.start, team.end).filter((sticker) => stickerMatchesSearch(sticker, query, language))
          }))
          .filter(({ stickers }) => stickers.length > 0);

        if (teamsWithStickers.length === 0) {
          return null;
        }

        const stickerCount = teamsWithStickers.reduce((sum, team) => sum + team.stickers.length, 0);

        return (
          <details className="group-block accordion-group" key={group.id} open={shouldOpen || undefined}>
            <summary>
              <h3>{stickerGroupLabel(group.letter, language)}</h3>
              <span className="summary-count">{stickerCount}</span>
            </summary>
            <div className="team-grid">
              {teamsWithStickers.map(({ team, stickers }) => (
                <StickerRangeBlock
                  key={team.id}
                  title={<TeamLabel team={team} language={language} />}
                  stickers={stickers}
                  getStatus={(sticker) => getStickerStatus(state, sticker)}
                  onClick={(sticker) => onToggle(sticker, mode)}
                  getLabel={(sticker) => sticker - team.start + 1}
                />
              ))}
            </div>
          </details>
        );
      })}
    </div>
  );
}

export function PublicStickerPicker({
  stickers,
  selected,
  color,
  language,
  emptyText,
  searchTerm = "",
  onToggle
}: PublicGridProps) {
  const selectedSet = new Set(selected);
  const stickerSet = new Set(stickers);
  const query = searchTerm.trim();
  const shouldOpen = Boolean(query);
  const fwcStickers = range(fwcRange.start, fwcRange.end).filter(
    (sticker) => stickerSet.has(sticker) && stickerMatchesSearch(sticker, query, language)
  );

  if (stickers.length === 0) {
    return <p className="empty-state">{emptyText}</p>;
  }

  return (
    <div className={`album-grid public ${color}`}>
      {fwcStickers.length > 0 ? (
        <details className="group-block accordion-group fwc-group" open={shouldOpen || undefined}>
          <summary>
            <h3>{text[language].fwc}</h3>
            <span className="summary-count">{fwcStickers.length}</span>
          </summary>
          <StickerRangeBlock
            title={text[language].fwc}
            stickers={fwcStickers}
            getStatus={(sticker) => (selectedSet.has(sticker) ? color : "unselected")}
            onClick={onToggle}
            compact
          />
        </details>
      ) : null}

      {groups.map((group) => {
        const teamsWithStickers = group.teams
          .map((team) => ({
            team,
            stickers: range(team.start, team.end).filter(
              (sticker) => stickerSet.has(sticker) && stickerMatchesSearch(sticker, query, language)
            )
          }))
          .filter((team) => team.stickers.length > 0);

        if (teamsWithStickers.length === 0) {
          return null;
        }

        const stickerCount = teamsWithStickers.reduce((sum, team) => sum + team.stickers.length, 0);

        return (
          <details className="group-block accordion-group" key={group.id} open={shouldOpen || undefined}>
            <summary>
              <h3>{stickerGroupLabel(group.letter, language)}</h3>
              <span className="summary-count">{stickerCount}</span>
            </summary>
            <div className="team-grid">
              {teamsWithStickers.map(({ team, stickers: teamStickers }) => (
                <StickerRangeBlock
                  key={team.id}
                  title={<TeamLabel team={team} language={language} />}
                  stickers={teamStickers}
                  getStatus={(sticker) => (selectedSet.has(sticker) ? color : "unselected")}
                  onClick={onToggle}
                  getLabel={(sticker) => sticker - team.start + 1}
                  compact
                />
              ))}
            </div>
          </details>
        );
      })}
    </div>
  );
}

function StickerRangeBlock({
  title,
  stickers,
  getStatus,
  onClick,
  getLabel,
  compact = false
}: {
  title: ReactNode;
  stickers: number[];
  getStatus: (sticker: number) => StickerVisualStatus;
  onClick: (sticker: number) => void;
  getLabel?: (sticker: number) => number;
  compact?: boolean;
}) {
  return (
    <article className={compact ? "sticker-block compact" : "sticker-block"}>
      <h4>{title}</h4>
      <div className="sticker-buttons">
        {stickers.map((sticker) => {
          const status = getStatus(sticker);
          const isSelected = status === "missing" || status === "trade";
          return (
            <button
              key={sticker}
              className={`sticker-button ${status}`}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onClick(sticker)}
            >
              {getLabel ? getLabel(sticker) : sticker}
            </button>
          );
        })}
      </div>
    </article>
  );
}

function TeamLabel({ team, language }: { team: Team; language: Language }) {
  return (
    <span className="team-label">
      <img
        className="flag-image"
        src={`/flags/${team.flagCode}.svg`}
        alt={team.flag}
        loading="lazy"
      />
      <span>
        {team.name[language]} ({team.abbr})
      </span>
    </span>
  );
}
