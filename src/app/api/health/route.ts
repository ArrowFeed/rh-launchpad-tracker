import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// A simple check that the app can actually reach the database. Visiting
// /api/health should return { ok: true, tokenCount: 0 } once the database
// is connected — if it errors instead, the DATABASE_URL or the database
// itself is the problem, not the app code.
export async function GET() {
  try {
    const tokenCount = await prisma.token.count();
    return NextResponse.json({ ok: true, tokenCount });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
