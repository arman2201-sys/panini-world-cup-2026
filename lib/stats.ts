import { FWC_STICKERS, TOTAL_STICKERS, groups, fwcRange } from "./album";

export type CollectionState = {
  missing: number[];
  trade: number[];
  updatedAt?: string;
  setupRequired?: boolean;
};

export type StickerStatus = "missing" | "trade" | "collected";

export function normalizeCollectionState(input: Partial<CollectionState> = {}): CollectionState {
  return {
    missing: uniqueSorted(input.missing ?? []),
    trade: uniqueSorted(input.trade ?? []).filter((number) => !(input.missing ?? []).includes(number)),
    updatedAt: input.updatedAt,
    setupRequired: input.setupRequired
  };
}

export function uniqueSorted(values: number[]) {
  return Array.from(new Set(values.filter((value) => Number.isInteger(value) && value >= 1 && value <= TOTAL_STICKERS))).sort(
    (a, b) => a - b
  );
}

export function getStickerStatus(state: CollectionState, sticker: number): StickerStatus {
  if (state.missing.includes(sticker)) {
    return "missing";
  }

  if (state.trade.includes(sticker)) {
    return "trade";
  }

  return "collected";
}

export function calculateStats(state: CollectionState) {
  const missingCount = state.missing.length;
  const tradeCount = state.trade.length;
  const collectedCount = TOTAL_STICKERS - missingCount;
  const progress = Math.round((collectedCount / TOTAL_STICKERS) * 1000) / 10;
  const missingSet = new Set(state.missing);

  const fwcMissing = countMissingInRange(missingSet, fwcRange.start, fwcRange.end);
  const fwcProgress = percent(FWC_STICKERS - fwcMissing, FWC_STICKERS);

  const groupProgress = groups.map((group) => {
    const total = group.teams.length * 20;
    const missing = group.teams.reduce((sum, team) => sum + countMissingInRange(missingSet, team.start, team.end), 0);
    return {
      id: group.id,
      letter: group.letter,
      total,
      missing,
      collected: total - missing,
      progress: percent(total - missing, total)
    };
  });

  const bestGroup = [...groupProgress].sort((a, b) => b.progress - a.progress || a.letter.localeCompare(b.letter))[0];

  return {
    total: TOTAL_STICKERS,
    missingCount,
    tradeCount,
    collectedCount,
    progress,
    fwcProgress,
    groupProgress,
    bestGroup
  };
}

function countMissingInRange(missingSet: Set<number>, start: number, end: number) {
  let total = 0;
  for (let sticker = start; sticker <= end; sticker += 1) {
    if (missingSet.has(sticker)) {
      total += 1;
    }
  }
  return total;
}

function percent(value: number, total: number) {
  return Math.round((value / total) * 1000) / 10;
}
