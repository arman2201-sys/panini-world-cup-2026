"use client";

import { useState } from "react";
import { fwcRange, groups, range, stickerGroupLabel, stickerMatchesSearch, type Language, type Team } from "@/lib/album";
import { text } from "@/lib/i18n";
import type { CollectionState } from "@/lib/stats";

type Props = {
  state: CollectionState;
  selectedCards: number[];
  language: Language;
  isSaving: boolean;
  onToggle: (sticker: number) => void;
  onCancel: () => void;
  onSave: () => void;
};

export function CardRegistrationPanel({
  state,
  selectedCards,
  language,
  isSaving,
  onToggle,
  onCancel,
  onSave
}: Props) {
  const t = text[language];
  const [searchTerm, setSearchTerm] = useState("");
  const missingSet = new Set(state.missing);
  const tradeSet = new Set(state.trade);
  const selectedSet = new Set(selectedCards);
  const query = searchTerm.trim();
  const shouldOpen = Boolean(query);
  const hasSelectedCards = selectedCards.length > 0;
  const selectedText = t.registerSelectedCounter.replace("{count}", String(selectedCards.length));

  return (
    <section className="panel register-panel" aria-labelledby="register-cards-title">
      <div className="register-panel-header">
        <div>
          <span className="kicker">{t.adminAccess}</span>
          <h2 id="register-cards-title">{t.registerCardsTitle}</h2>
          <p>{t.registerCardsHelper}</p>
          <small>{t.registerCardsLogic}</small>
        </div>
      </div>

      <div className="register-guide" aria-label={t.registerColorGuide}>
        <span>
          <i className="guide-dot missing" /> {t.registerGuideMissing}
        </span>
        <span>
          <i className="guide-dot duplicate" /> {t.registerGuideDuplicate}
        </span>
        <span>
          <i className="guide-dot selected" /> {t.registerGuideSelected}
        </span>
        <span>
          <i className="guide-dot neutral" /> {t.registerGuideUnselected}
        </span>
      </div>

      <label className="search-field">
        <span>{t.searchPlaceholder}</span>
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder={t.searchPlaceholder}
        />
      </label>

      <div className="register-album-grid">
        <RegistrationGroup
          title={t.registerFwc}
          stickers={range(fwcRange.start, fwcRange.end).filter((sticker) =>
            stickerMatchesSearch(sticker, query, language)
          )}
          missingSet={missingSet}
          tradeSet={tradeSet}
          selectedSet={selectedSet}
          language={language}
          open={shouldOpen}
          onToggle={onToggle}
        />

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
            <details className="accordion-group register-group" key={group.id} open={shouldOpen || undefined}>
              <summary>
                <h3>{stickerGroupLabel(group.letter, language)}</h3>
                <span className="summary-count">{stickerCount}</span>
              </summary>
              <div className="team-grid">
                {teamsWithStickers.map(({ team, stickers }) => (
                  <RegistrationTeam
                    key={team.id}
                    team={team}
                    stickers={stickers}
                    missingSet={missingSet}
                    tradeSet={tradeSet}
                    selectedSet={selectedSet}
                    language={language}
                    onToggle={onToggle}
                  />
                ))}
              </div>
            </details>
          );
        })}
      </div>

      <div className={hasSelectedCards ? "register-actions visible" : "register-actions"} aria-hidden={!hasSelectedCards}>
        <div className="register-actions-counter" aria-live="polite">
          {selectedText}
        </div>
        <div className="register-action-buttons">
          <button className="secondary-button" type="button" onClick={onCancel} disabled={!hasSelectedCards || isSaving}>
            {t.registerCancel}
          </button>
          <button className="primary-button" type="button" onClick={onSave} disabled={!hasSelectedCards || isSaving}>
            {isSaving ? t.saving : t.registerSave}
          </button>
        </div>
      </div>
    </section>
  );
}

function RegistrationGroup({
  title,
  stickers,
  missingSet,
  tradeSet,
  selectedSet,
  language,
  open,
  onToggle
}: {
  title: string;
  stickers: number[];
  missingSet: Set<number>;
  tradeSet: Set<number>;
  selectedSet: Set<number>;
  language: Language;
  open: boolean;
  onToggle: (sticker: number) => void;
}) {
  if (stickers.length === 0) {
    return null;
  }

  return (
    <details className="accordion-group register-group fwc-group" open={open || undefined}>
      <summary>
        <h3>{title}</h3>
        <span className="summary-count">{stickers.length}</span>
      </summary>
      <article className="sticker-block compact">
        <h4>{title}</h4>
        <RegistrationButtons
          stickers={stickers}
          missingSet={missingSet}
          tradeSet={tradeSet}
          selectedSet={selectedSet}
          language={language}
          onToggle={onToggle}
        />
      </article>
    </details>
  );
}

function RegistrationTeam({
  team,
  stickers,
  missingSet,
  tradeSet,
  selectedSet,
  language,
  onToggle
}: {
  team: Team;
  stickers: number[];
  missingSet: Set<number>;
  tradeSet: Set<number>;
  selectedSet: Set<number>;
  language: Language;
  onToggle: (sticker: number) => void;
}) {
  return (
    <article className="sticker-block">
      <h4>
        <span className="team-label">
          <img className="flag-image" src={`/flags/${team.flagCode}.svg`} alt={team.flag} loading="lazy" />
          <span>
            {team.name[language]} ({team.abbr})
          </span>
        </span>
      </h4>
      <RegistrationButtons
        stickers={stickers}
        missingSet={missingSet}
        tradeSet={tradeSet}
        selectedSet={selectedSet}
        language={language}
        onToggle={onToggle}
        getLabel={(sticker) => sticker - team.start + 1}
      />
    </article>
  );
}

function RegistrationButtons({
  stickers,
  missingSet,
  tradeSet,
  selectedSet,
  language,
  onToggle,
  getLabel
}: {
  stickers: number[];
  missingSet: Set<number>;
  tradeSet: Set<number>;
  selectedSet: Set<number>;
  language: Language;
  onToggle: (sticker: number) => void;
  getLabel?: (sticker: number) => number;
}) {
  const t = text[language];

  return (
    <div className="register-card-buttons">
      {stickers.map((sticker) => {
        const isSelected = selectedSet.has(sticker);
        const isMissing = missingSet.has(sticker);
        const isTrade = tradeSet.has(sticker);
        const isDuplicate = isSelected && !isMissing;
        const className = [
          "register-card-button",
          isSelected ? "selected" : isMissing ? "missing" : isTrade ? "duplicate" : "neutral",
          isDuplicate ? "selected-duplicate" : ""
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <button
            className={className}
            key={sticker}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onToggle(sticker)}
          >
            <span>{getLabel ? getLabel(sticker) : sticker}</span>
            {isSelected ? <small>{isMissing ? t.registerNewBadge : t.registerDuplicateBadge}</small> : null}
          </button>
        );
      })}
    </div>
  );
}
