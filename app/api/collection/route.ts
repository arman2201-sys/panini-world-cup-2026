import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { isValidStickerNumber } from "@/lib/album";
import { readCollectionFromGoogleSheets, writeCollectionToGoogleSheets } from "@/lib/googleSheets";
import { normalizeCollectionState, uniqueSorted } from "@/lib/stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const collection = await readCollectionFromGoogleSheets();
    return NextResponse.json(collection);
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { missing?: unknown[]; trade?: unknown[] };
    const missing = validateStickerArray(body.missing);
    const trade = validateStickerArray(body.trade);
    const saved = await writeCollectionToGoogleSheets(normalizeCollectionState({ missing, trade }));

    return NextResponse.json(saved);
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

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}
