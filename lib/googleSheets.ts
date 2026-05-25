import { createSign } from "crypto";
import { fwcRange, groups, isValidStickerNumber, range, TOTAL_STICKERS, type Team } from "./album";
import { normalizeCollectionState, uniqueSorted, type CollectionState } from "./stats";

const MISSING_TAB = "MANGLER";
const TRADE_TAB = "BYTTES VÆK";
const COLLECTION_TAB = "Collection";
const PROPOSALS_TAB = "TradeProposals";
const INITIALIZED_MARKER = "__initialized__";
const SCOPES = "https://www.googleapis.com/auth/spreadsheets";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SHEETS_URL = "https://sheets.googleapis.com/v4/spreadsheets";

type GoogleConfig = {
  sheetId: string;
  clientEmail: string;
  privateKey: string;
};

type TokenCache = {
  accessToken: string;
  expiresAt: number;
};

type SheetStructure = {
  missingTab: string;
  tradeTab: string;
  hadAlbumTabs: boolean;
};

type LayoutEntry = {
  key: string;
  label: string;
  start: number;
  end: number;
  team?: Team;
};

let tokenCache: TokenCache | undefined;

const layoutEntries: LayoutEntry[] = [
  {
    key: "fwc",
    label: "🏆 FWC",
    start: fwcRange.start,
    end: fwcRange.end
  },
  ...groups.flatMap((group) =>
    group.teams.map((team) => ({
      key: `team:${team.abbr}`,
      label: `${team.flagCode.toUpperCase()} ${team.abbr}`,
      start: team.start,
      end: team.end,
      team
    }))
  )
];

export type TradeProposal = {
  name: string;
  contact: string;
  address: string;
  note: string;
  hasForMe: number[];
  wantsFromMe: number[];
  language: string;
};

export type TradeProposalRecord = TradeProposal & {
  rowNumber: number;
  timestamp: string;
  status: "pending" | "accepted" | "rejected";
  acceptedAt: string;
  rejectedAt: string;
};

export function hasGoogleSheetsConfig() {
  return Boolean(getGoogleConfig());
}

export async function readCollectionFromGoogleSheets(): Promise<CollectionState> {
  const config = getGoogleConfig();
  if (!config) {
    return normalizeCollectionState({ setupRequired: true });
  }

  const structure = await ensureSheetStructure(config);

  if (structure.hadAlbumTabs) {
    const missing = await readStickerLayoutTab(config, structure.missingTab);
    const trade = await readStickerLayoutTab(config, structure.tradeTab);

    return normalizeCollectionState({
      missing: missing.stickers,
      trade: trade.stickers,
      updatedAt: trade.updatedAt || missing.updatedAt
    });
  }

  return readInternalCollection(config);
}

export async function writeCollectionToGoogleSheets(state: CollectionState) {
  const config = requireGoogleConfig();
  const normalized = normalizeCollectionState(state);
  const updatedAt = new Date().toISOString();
  const structure = await ensureSheetStructure(config);

  await writeStickerLayoutTab(config, structure.missingTab, normalized.missing);
  await writeStickerLayoutTab(config, structure.tradeTab, normalized.trade);
  await writeInternalCollection(config, normalized, updatedAt);

  return normalizeCollectionState({ ...normalized, updatedAt });
}

export async function appendTradeProposalToGoogleSheets(proposal: TradeProposal) {
  const config = requireGoogleConfig();
  await ensureSheetStructure(config);
  await googleRequest(
    config,
    `/values/${encodeURIComponent(a1Range(PROPOSALS_TAB, "A:K"))}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      body: JSON.stringify({
        values: [
          [
            new Date().toISOString(),
            proposal.name,
            proposal.contact,
            proposal.address,
            proposal.hasForMe.join(", "),
            proposal.wantsFromMe.join(", "),
            proposal.note,
            proposal.language,
            "pending",
            "",
            ""
          ]
        ]
      })
    }
  );
}

export async function readTradeProposalsFromGoogleSheets() {
  const config = requireGoogleConfig();
  await ensureSheetStructure(config);
  const result = await googleRequest<{ values?: string[][] }>(
    config,
    `/values/${encodeURIComponent(a1Range(PROPOSALS_TAB, "A2:K1000"))}`
  );

  return (result.values ?? [])
    .map((row, index) => parseProposalRow(row, index + 2))
    .filter((proposal) => proposal.timestamp || proposal.name || proposal.hasForMe.length || proposal.wantsFromMe.length)
    .reverse();
}

export async function acceptTradeProposalInGoogleSheets(rowNumber: number) {
  if (!Number.isInteger(rowNumber) || rowNumber < 2 || rowNumber > 1000) {
    throw new Error("Invalid proposal row.");
  }

  const config = requireGoogleConfig();
  await ensureSheetStructure(config);
  const result = await googleRequest<{ values?: string[][] }>(
    config,
    `/values/${encodeURIComponent(a1Range(PROPOSALS_TAB, `A${rowNumber}:K${rowNumber}`))}`
  );
  const row = result.values?.[0];

  if (!row) {
    throw new Error("Trade proposal not found.");
  }

  const proposal = parseProposalRow(row, rowNumber);

  if (proposal.status !== "pending") {
    throw new Error("Trade proposal is already handled.");
  }

  const current = await readCollectionFromGoogleSheets();
  const received = new Set(proposal.hasForMe);
  const givenAway = new Set(proposal.wantsFromMe);
  const saved = await writeCollectionToGoogleSheets({
    missing: current.missing.filter((sticker) => !received.has(sticker)),
    trade: current.trade.filter((sticker) => !givenAway.has(sticker))
  });
  const acceptedAt = new Date().toISOString();

  const statusRange = getProposalStatusRange(row, rowNumber);
  await googleRequest(config, `/values/${encodeURIComponent(a1Range(PROPOSALS_TAB, statusRange))}?valueInputOption=RAW`, {
    method: "PUT",
    body: JSON.stringify({
      range: a1Range(PROPOSALS_TAB, statusRange),
      values: [["accepted", acceptedAt, proposal.rejectedAt]]
    })
  });

  return {
    collection: saved,
    proposal: {
      ...proposal,
      status: "accepted" as const,
      acceptedAt
    }
  };
}

export async function rejectTradeProposalInGoogleSheets(rowNumber: number) {
  if (!Number.isInteger(rowNumber) || rowNumber < 2 || rowNumber > 1000) {
    throw new Error("Invalid proposal row.");
  }

  const config = requireGoogleConfig();
  await ensureSheetStructure(config);
  const result = await googleRequest<{ values?: string[][] }>(
    config,
    `/values/${encodeURIComponent(a1Range(PROPOSALS_TAB, `A${rowNumber}:K${rowNumber}`))}`
  );
  const row = result.values?.[0];

  if (!row) {
    throw new Error("Trade proposal not found.");
  }

  const proposal = parseProposalRow(row, rowNumber);

  if (proposal.status !== "pending") {
    throw new Error("Trade proposal is already handled.");
  }

  const rejectedAt = new Date().toISOString();

  const statusRange = getProposalStatusRange(row, rowNumber);
  await googleRequest(config, `/values/${encodeURIComponent(a1Range(PROPOSALS_TAB, statusRange))}?valueInputOption=RAW`, {
    method: "PUT",
    body: JSON.stringify({
      range: a1Range(PROPOSALS_TAB, statusRange),
      values: [["rejected", proposal.acceptedAt, rejectedAt]]
    })
  });

  return {
    proposal: {
      ...proposal,
      status: "rejected" as const,
      rejectedAt
    }
  };
}

async function readStickerLayoutTab(config: GoogleConfig, tab: string) {
  const result = await googleRequest<{ values?: string[][] }>(
    config,
    `/values/${encodeURIComponent(a1Range(tab, "A1:B250"))}`
  );

  const stickers: number[] = [];
  let updatedAt = "";

  for (const row of result.values ?? []) {
    const entry = findLayoutEntry(row[0] ?? "");
    if (!entry) {
      continue;
    }

    for (const sticker of parseStickerList(row[1] ?? "")) {
      const absoluteSticker = toAbsoluteSticker(entry, sticker);
      if (absoluteSticker) {
        stickers.push(absoluteSticker);
      }
    }

    if (row[2]) {
      updatedAt = row[2];
    }
  }

  return {
    stickers: uniqueSorted(stickers),
    updatedAt
  };
}

async function writeStickerLayoutTab(config: GoogleConfig, tab: string, stickers: number[]) {
  let rows = await readTabRows(config, tab);
  let rowMap = getLayoutRowMap(rows);

  if (rowMap.size < layoutEntries.length) {
    await writeDefaultStickerLayout(config, tab);
    rows = await readTabRows(config, tab);
    rowMap = getLayoutRowMap(rows);
  }

  const data = layoutEntries
    .map((entry) => {
      const rowIndex = rowMap.get(entry.key);
      if (rowIndex === undefined) {
        return undefined;
      }

      return {
        range: a1Range(tab, `B${rowIndex + 1}`),
        majorDimension: "ROWS",
        values: [[formatRelativeStickerList(entry, stickers)]]
      };
    })
    .filter(Boolean);

  await googleRequest(config, "/values:batchUpdate", {
    method: "POST",
    body: JSON.stringify({
      valueInputOption: "RAW",
      data
    })
  });
}

async function readInternalCollection(config: GoogleConfig): Promise<CollectionState> {
  const result = await googleRequest<{ values?: string[][] }>(
    config,
    `/values/${encodeURIComponent(a1Range(COLLECTION_TAB, "A2:C1000"))}`
  );

  const missing: number[] = [];
  const trade: number[] = [];
  let updatedAt = "";
  const rows = result.values ?? [];

  if (rows.length === 0) {
    return normalizeCollectionState({ missing: range(1, TOTAL_STICKERS), updatedAt });
  }

  for (const row of rows) {
    if (row[0] === INITIALIZED_MARKER) {
      updatedAt = row[2] || updatedAt;
      continue;
    }

    const sticker = Number(row[0]);
    const status = row[1];
    if (!isValidStickerNumber(sticker)) {
      continue;
    }

    if (status === "missing") {
      missing.push(sticker);
    }

    if (status === "trade") {
      trade.push(sticker);
    }

    if (row[2]) {
      updatedAt = row[2];
    }
  }

  return normalizeCollectionState({ missing, trade, updatedAt });
}

async function writeInternalCollection(config: GoogleConfig, state: CollectionState, updatedAt: string) {
  const normalized = normalizeCollectionState(state);
  const values = [
    [INITIALIZED_MARKER, "initialized", updatedAt],
    ...normalized.missing.map((sticker) => [sticker, "missing", updatedAt]),
    ...normalized.trade.map((sticker) => [sticker, "trade", updatedAt])
  ];

  await googleRequest(config, `/values/${encodeURIComponent(a1Range(COLLECTION_TAB, "A2:C1000"))}:clear`, {
    method: "POST",
    body: JSON.stringify({})
  });

  await googleRequest(
    config,
    `/values/${encodeURIComponent(a1Range(COLLECTION_TAB, `A2:C${values.length + 1}`))}?valueInputOption=RAW`,
    {
      method: "PUT",
      body: JSON.stringify({
        range: a1Range(COLLECTION_TAB, `A2:C${values.length + 1}`),
        majorDimension: "ROWS",
        values
      })
    }
  );
}

async function ensureSheetStructure(config: GoogleConfig): Promise<SheetStructure> {
  const metadata = await googleRequest<{ sheets?: Array<{ properties?: { title?: string } }> }>(
    config,
    "?fields=sheets.properties.title"
  );
  const titles = (metadata.sheets ?? []).map((sheet) => sheet.properties?.title).filter(Boolean) as string[];
  const missingTab = findExistingTab(titles, MISSING_TAB) ?? MISSING_TAB;
  const tradeTab = findExistingTab(titles, TRADE_TAB) ?? TRADE_TAB;
  const hadMissingTab = Boolean(findExistingTab(titles, MISSING_TAB));
  const hadTradeTab = Boolean(findExistingTab(titles, TRADE_TAB));
  const existingTabs = new Set(titles);
  const requests = [];

  if (!hadMissingTab) {
    requests.push({ addSheet: { properties: { title: MISSING_TAB } } });
  }

  if (!hadTradeTab) {
    requests.push({ addSheet: { properties: { title: TRADE_TAB } } });
  }

  if (!existingTabs.has(COLLECTION_TAB)) {
    requests.push({ addSheet: { properties: { title: COLLECTION_TAB } } });
  }

  if (!existingTabs.has(PROPOSALS_TAB)) {
    requests.push({ addSheet: { properties: { title: PROPOSALS_TAB } } });
  }

  if (requests.length > 0) {
    await googleRequest(config, ":batchUpdate", {
      method: "POST",
      body: JSON.stringify({ requests })
    });
  }

  if (!hadMissingTab) {
    await writeDefaultStickerLayout(config, MISSING_TAB);
  }

  if (!hadTradeTab) {
    await writeDefaultStickerLayout(config, TRADE_TAB);
  }

  await googleRequest(config, `/values/${encodeURIComponent(a1Range(COLLECTION_TAB, "A1:C1"))}?valueInputOption=RAW`, {
    method: "PUT",
    body: JSON.stringify({
      range: a1Range(COLLECTION_TAB, "A1:C1"),
      values: [["sticker", "status", "updatedAt"]]
    })
  });

  await googleRequest(config, `/values/${encodeURIComponent(a1Range(PROPOSALS_TAB, "A1:K1"))}?valueInputOption=RAW`, {
    method: "PUT",
    body: JSON.stringify({
      range: a1Range(PROPOSALS_TAB, "A1:K1"),
      values: [
        [
          "timestamp",
          "name",
          "contact",
          "address",
          "hasForMe",
          "wantsFromMe",
          "note",
          "language",
          "status",
          "acceptedAt",
          "rejectedAt"
        ]
      ]
    })
  });

  return {
    missingTab,
    tradeTab,
    hadAlbumTabs: hadMissingTab || hadTradeTab
  };
}

async function readTabRows(config: GoogleConfig, tab: string) {
  const result = await googleRequest<{ values?: string[][] }>(
    config,
    `/values/${encodeURIComponent(a1Range(tab, "A1:B250"))}`
  );
  return result.values ?? [];
}

async function writeDefaultStickerLayout(config: GoogleConfig, tab: string) {
  const values = buildDefaultStickerLayout(tab);

  await googleRequest(config, `/values/${encodeURIComponent(a1Range(tab, `A1:B${values.length}`))}?valueInputOption=RAW`, {
    method: "PUT",
    body: JSON.stringify({
      range: a1Range(tab, `A1:B${values.length}`),
      majorDimension: "ROWS",
      values
    })
  });
}

function buildDefaultStickerLayout(tab: string) {
  const values: string[][] = [
    [tab, ""],
    ["", ""],
    ["SÆRSKILTE STICKERS", ""],
    ["Type", "Sticker numre"],
    ["🏆 FWC", ""],
    ["", ""]
  ];

  for (const group of groups) {
    values.push([`Gruppe ${group.letter}`, ""]);
    values.push(["Land", ""]);
    for (const team of group.teams) {
      values.push([`${team.flagCode.toUpperCase()} ${team.abbr}`, ""]);
    }
    values.push(["", ""]);
  }

  return values;
}

function getLayoutRowMap(rows: string[][]) {
  const rowMap = new Map<string, number>();

  rows.forEach((row, index) => {
    const entry = findLayoutEntry(row[0] ?? "");
    if (entry) {
      rowMap.set(entry.key, index);
    }
  });

  return rowMap;
}

function findLayoutEntry(label: string) {
  const normalized = label.toUpperCase();
  if (/\bFWC\b/.test(normalized)) {
    return layoutEntries[0];
  }

  return layoutEntries.find((entry) => entry.team && new RegExp(`\\b${entry.team.abbr}\\b`).test(normalized));
}

function parseStickerList(value: string) {
  return (value.match(/\d+/g) ?? []).map(Number);
}

function parseProposalRow(row: string[], rowNumber: number): TradeProposalRecord {
  const isNewAddressFormat = Boolean(getKnownProposalStatus(row[8]));
  const statusIndex = isNewAddressFormat ? 8 : 7;

  return {
    rowNumber,
    timestamp: row[0] ?? "",
    name: row[1] ?? "",
    contact: row[2] ?? "",
    address: isNewAddressFormat ? row[3] ?? "" : "",
    hasForMe: uniqueSorted(parseStickerList(row[isNewAddressFormat ? 4 : 3] ?? "")),
    wantsFromMe: uniqueSorted(parseStickerList(row[isNewAddressFormat ? 5 : 4] ?? "")),
    note: row[isNewAddressFormat ? 6 : 5] ?? "",
    language: row[isNewAddressFormat ? 7 : 6] ?? "da",
    status: getProposalStatus(row[statusIndex]),
    acceptedAt: row[isNewAddressFormat ? 9 : 8] ?? "",
    rejectedAt: row[isNewAddressFormat ? 10 : 9] ?? ""
  };
}

function getProposalStatusRange(row: string[], rowNumber: number) {
  return getKnownProposalStatus(row[8]) ? `I${rowNumber}:K${rowNumber}` : `H${rowNumber}:J${rowNumber}`;
}

function getKnownProposalStatus(value: string | undefined): TradeProposalRecord["status"] | undefined {
  return value === "accepted" || value === "rejected" || value === "pending" ? value : undefined;
}

function getProposalStatus(value: string | undefined): TradeProposalRecord["status"] {
  return getKnownProposalStatus(value) ?? "pending";
}

function toAbsoluteSticker(entry: LayoutEntry, sticker: number) {
  if (entry.key === "fwc") {
    return sticker >= fwcRange.start && sticker <= fwcRange.end ? sticker : undefined;
  }

  if (sticker >= 1 && sticker <= entry.end - entry.start + 1) {
    return entry.start + sticker - 1;
  }

  return sticker >= entry.start && sticker <= entry.end ? sticker : undefined;
}

function formatRelativeStickerList(entry: LayoutEntry, stickers: number[]) {
  return uniqueSorted(stickers)
    .filter((sticker) => sticker >= entry.start && sticker <= entry.end)
    .map((sticker) => (entry.key === "fwc" ? sticker : sticker - entry.start + 1))
    .join(", ");
}

function a1Range(sheetName: string, rangePart: string) {
  return `'${sheetName.replace(/'/g, "''")}'!${rangePart}`;
}

function findExistingTab(titles: string[], desired: string) {
  const normalizedDesired = normalizeTabTitle(desired);
  return titles.find((title) => normalizeTabTitle(title) === normalizedDesired);
}

function normalizeTabTitle(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/Æ/g, "AE")
    .replace(/Ø/g, "O")
    .replace(/Å/g, "AA")
    .replace(/\s+/g, " ");
}

async function googleRequest<T = unknown>(config: GoogleConfig, path: string, init: RequestInit = {}): Promise<T> {
  const accessToken = await getAccessToken(config);
  const response = await fetch(`${SHEETS_URL}/${config.sheetId}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Google Sheets request failed (${response.status}): ${details}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

async function getAccessToken(config: GoogleConfig) {
  const now = Math.floor(Date.now() / 1000);
  if (tokenCache && tokenCache.expiresAt - 60 > now) {
    return tokenCache.accessToken;
  }

  const header = encodeBase64Url({ alg: "RS256", typ: "JWT" });
  const claim = encodeBase64Url({
    iss: config.clientEmail,
    scope: SCOPES,
    aud: TOKEN_URL,
    exp: now + 3600,
    iat: now
  });
  const unsignedToken = `${header}.${claim}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsignedToken);
  signer.end();
  const signature = signer.sign(config.privateKey).toString("base64url");
  const assertion = `${unsignedToken}.${signature}`;

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    })
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Google OAuth token request failed (${response.status}): ${details}`);
  }

  const token = (await response.json()) as { access_token: string; expires_in: number };
  tokenCache = {
    accessToken: token.access_token,
    expiresAt: now + token.expires_in
  };

  return token.access_token;
}

function encodeBase64Url(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function requireGoogleConfig() {
  const config = getGoogleConfig();
  if (!config) {
    throw new Error("Google Sheets environment variables are missing.");
  }

  return config;
}

function getGoogleConfig(): GoogleConfig | undefined {
  const sheetId = process.env.GOOGLE_SHEET_ID?.trim();
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const privateKey = cleanPrivateKey(process.env.GOOGLE_PRIVATE_KEY);

  if (!sheetId || !clientEmail || !privateKey) {
    return undefined;
  }

  return {
    sheetId,
    clientEmail,
    privateKey
  };
}

function cleanPrivateKey(value?: string) {
  if (!value) {
    return "";
  }

  const unquoted = value.startsWith("\"") && value.endsWith("\"") ? value.slice(1, -1) : value;
  return unquoted.replace(/\\n/g, "\n");
}
