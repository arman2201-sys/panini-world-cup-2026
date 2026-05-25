import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const privateKey = cleanPrivateKey(process.env.GOOGLE_PRIVATE_KEY);

  return NextResponse.json({
    googleSheetId: process.env.GOOGLE_SHEET_ID?.trim() || null,
    serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim() || null,
    privateKeyPresent: Boolean(process.env.GOOGLE_PRIVATE_KEY),
    privateKeyLooksValid:
      privateKey.startsWith("-----BEGIN PRIVATE KEY-----") && privateKey.includes("-----END PRIVATE KEY-----")
  });
}

function cleanPrivateKey(value?: string) {
  if (!value) {
    return "";
  }

  const unquoted = value.startsWith("\"") && value.endsWith("\"") ? value.slice(1, -1) : value;
  return unquoted.replace(/\\n/g, "\n");
}
