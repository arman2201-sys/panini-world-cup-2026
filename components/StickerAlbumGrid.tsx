"use client";

import type { ReactNode } from "react";
import { fwcRange, groups, range, stickerGroupLabel, type Language, type Team } from "@/lib/album";
import { text } from "@/lib/i18n";
import type { CollectionState, StickerStatus } from "@/lib/stats";

type AdminGridProps = {
  mode: "missing" | "trade";
  state: CollectionState;
  language: Language;
  onToggle: (sticker: number, mode: "missing" | "trade") => void;
};

type PublicGridProps = {
  stickers: number[];
  selected: number[];
  color: "missing" | "trade";
  language: Language;
  emptyText: string;
  onToggle: (sticker: number) => void;
};

export function StickerAlbumGrid({ mode, state, language, onToggle }: AdminGridProps) {
  const t = text[language];
  const selected = new Set(mode === "missing" ? state.missing : state.trade);

  return (
    <div className={`album-grid ${mode}`}>
      <StickerRangeBlock
        title={t.fwc}
        stickers={range(fwcRange.start, fwcRange.end)}
        selected={selected}
        status={mode}
        onClick={(sticker) => onToggle(sticker, mode)}
      />

      {groups.map((group) => (
        <section className="group-block" key={group.id}>
          <h3>{stickerGroupLabel(group.letter, language)}</h3>
          <div className="team-grid">
            {group.teams.map((team) => (
              <StickerRangeBlock
                key={team.id}
                title={<TeamLabel team={team} language={language} />}
                stickers={range(team.start, team.end)}
                selected={selected}
                status={mode}
                onClick={(sticker) => onToggle(sticker, mode)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function PublicStickerPicker({ stickers, selected, color, language, emptyText, onToggle }: PublicGridProps) {
  const selectedSet = new Set(selected);
  const stickerSet = new Set(stickers);
  const fwcStickers = range(fwcRange.start, fwcRange.end).filter((sticker) => stickerSet.has(sticker));

  if (stickers.length === 0) {
    return <p className="empty-state">{emptyText}</p>;
  }

  return (
    <div className={`album-grid public ${color}`}>
      {fwcStickers.length > 0 ? (
        <StickerRangeBlock
          title={text[language].fwc}
          stickers={fwcStickers}
          selected={selectedSet}
          status={color}
          onClick={onToggle}
          compact
        />
      ) : null}

      {groups.map((group) => {
        const teamsWithStickers = group.teams
          .map((team) => ({
            team,
            stickers: range(team.start, team.end).filter((sticker) => stickerSet.has(sticker))
          }))
          .filter((team) => team.stickers.length > 0);

        if (teamsWithStickers.length === 0) {
          return null;
        }

        return (
          <section className="group-block" key={group.id}>
            <h3>{stickerGroupLabel(group.letter, language)}</h3>
            <div className="team-grid">
              {teamsWithStickers.map(({ team, stickers: teamStickers }) => (
                <StickerRangeBlock
                  key={team.id}
                  title={<TeamLabel team={team} language={language} />}
                  stickers={teamStickers}
                  selected={selectedSet}
                  status={color}
                  onClick={onToggle}
                  compact
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function StickerRangeBlock({
  title,
  stickers,
  selected,
  status,
  onClick,
  compact = false
}: {
  title: ReactNode;
  stickers: number[];
  selected: Set<number>;
  status: StickerStatus;
  onClick: (sticker: number) => void;
  compact?: boolean;
}) {
  return (
    <article className={compact ? "sticker-block compact" : "sticker-block"}>
      <h4>{title}</h4>
      <div className="sticker-buttons">
        {stickers.map((sticker) => {
          const isSelected = selected.has(sticker);
          return (
            <button
              key={sticker}
              className={isSelected ? `sticker-button ${status}` : "sticker-button neutral"}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onClick(sticker)}
            >
              {sticker}
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
