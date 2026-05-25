import { createSign } from "crypto";
import { isValidStickerNumber, range, TOTAL_STICKERS } from "./album";
import { normalizeCollectionState, type CollectionState } from "./stats";

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

let tokenCache: TokenCache | undefined;

export type TradeProposal = {
  name: string;
  contact: string;
  note: string;
  hasForMe: number[];
  wantsFromMe: number[];
  language: string;
};

export function hasGoogleSheetsConfig() {
  return Boolean(getGoogleConfig());
}

export async function readCollectionFromGoogleSheets(): Promise<CollectionState> {
  const config = getGoogleConfig();
  if (!config) {
    return normalizeCollectionState({ setupRequired: true });
  }

  await ensureSheetStructure(config);
  const result = await googleRequest<{ values?: string[][] }>(
    config,
    `/values/${encodeURIComponent(`${COLLECTION_TAB}!A2:C1000`)}`
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

export async function writeCollectionToGoogleSheets(state: CollectionState) {
  const config = requireGoogleConfig();
  const normalized = normalizeCollectionState(state);
  const updatedAt = new Date().toISOString();
  const values = [
    [INITIALIZED_MARKER, "initialized", updatedAt],
    ...normalized.missing.map((sticker) => [sticker, "missing", updatedAt]),
    ...normalized.trade.map((sticker) => [sticker, "trade", updatedAt])
  ];

  await ensureSheetStructure(config);
  await googleRequest(config, `/values/${encodeURIComponent(`${COLLECTION_TAB}!A2:C1000`)}:clear`, {
    method: "POST",
    body: JSON.stringify({})
  });

  await googleRequest(
    config,
    `/values/${encodeURIComponent(`${COLLECTION_TAB}!A2:C${values.length + 1}`)}?valueInputOption=RAW`,
    {
      method: "PUT",
      body: JSON.stringify({
        range: `${COLLECTION_TAB}!A2:C${values.length + 1}`,
        majorDimension: "ROWS",
        values
      })
    }
  );

  return normalizeCollectionState({ ...normalized, updatedAt });
}

export async function appendTradeProposalToGoogleSheets(proposal: TradeProposal) {
  const config = requireGoogleConfig();
  await ensureSheetStructure(config);
  await googleRequest(
    config,
    `/values/${encodeURIComponent(`${PROPOSALS_TAB}!A:G`)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      body: JSON.stringify({
        values: [
          [
            new Date().toISOString(),
            proposal.name,
            proposal.contact,
            proposal.hasForMe.join(", "),
            proposal.wantsFromMe.join(", "),
            proposal.note,
            proposal.language
          ]
        ]
      })
    }
  );
}

async function ensureSheetStructure(config: GoogleConfig) {
  const metadata = await googleRequest<{ sheets?: Array<{ properties?: { title?: string } }> }>(
    config,
    "?fields=sheets.properties.title"
  );
  const existingTabs = new Set((metadata.sheets ?? []).map((sheet) => sheet.properties?.title).filter(Boolean));
  const requests = [];

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

  await googleRequest(config, `/values/${encodeURIComponent(`${COLLECTION_TAB}!A1:C1`)}?valueInputOption=RAW`, {
    method: "PUT",
    body: JSON.stringify({
      range: `${COLLECTION_TAB}!A1:C1`,
      values: [["sticker", "status", "updatedAt"]]
    })
  });

  await googleRequest(config, `/values/${encodeURIComponent(`${PROPOSALS_TAB}!A1:G1`)}?valueInputOption=RAW`, {
    method: "PUT",
    body: JSON.stringify({
      range: `${PROPOSALS_TAB}!A1:G1`,
      values: [["timestamp", "name", "contact", "hasForMe", "wantsFromMe", "note", "language"]]
    })
  });
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
