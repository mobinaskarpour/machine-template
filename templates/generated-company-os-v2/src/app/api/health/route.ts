import { NextResponse } from "next/server";
import { runtime } from "@/lib/runtime";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    companySlug: runtime.company.slug,
    generationId: process.env.MACHINE_GENERATION_ID ?? "unknown",
  });
}
