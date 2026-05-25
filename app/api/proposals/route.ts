import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { isValidStickerNumber } from "@/lib/album";
import {
  acceptTradeProposalInGoogleSheets,
  appendTradeProposalToGoogleSheets,
  readTradeProposalsFromGoogleSheets
} from "@/lib/googleSheets";
import { uniqueSorted } from "@/lib/stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const proposals = await readTradeProposalsFromGoogleSheets();
    return NextResponse.json({ proposals });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      name?: string;
      contact?: string;
      note?: string;
      language?: string;
      hasForMe?: unknown[];
      wantsFromMe?: unknown[];
    };
    const hasForMe = validateStickerArray(body.hasForMe);
    const wantsFromMe = validateStickerArray(body.wantsFromMe);

    if (hasForMe.length + wantsFromMe.length < 5) {
      return NextResponse.json({ error: "At least 5 stickers must be selected." }, { status: 400 });
    }

    await appendTradeProposalToGoogleSheets({
      name: cleanText(body.name),
      contact: cleanText(body.contact),
      note: cleanText(body.note),
      hasForMe,
      wantsFromMe,
      language: body.language === "bs" ? "bs" : "da"
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { rowNumber?: unknown };
    const rowNumber = Number(body.rowNumber);
    const result = await acceptTradeProposalInGoogleSheets(rowNumber);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}

function validateStickerArray(values: unknown[] = []) {
  if (!Array.isArray(values)) {
    throw new Error("Sticker list must be an array.");
  }

  const stickers = values.map(Number);
  if (!stickers.every(isValidStickerNumber)) {
    throw new Error("Sticker numbers must be between 1 and 980.");
  }

  return uniqueSorted(stickers);
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 500) : "";
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}
