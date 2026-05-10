import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { BrochureDocument } from "@/lib/pdf/brochure";

export const runtime = "nodejs"; // @react-pdf/renderer needs Node, not Edge.
export const dynamic = "force-dynamic";

export async function GET() {
  // BrochureDocument is a Document element — render to a Buffer and stream.
  // NextResponse no longer accepts Node Buffer directly; coerce to Uint8Array.
  const buffer = await renderToBuffer(BrochureDocument());
  const body = new Uint8Array(buffer);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition":
        'attachment; filename="readiness-overview.pdf"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
