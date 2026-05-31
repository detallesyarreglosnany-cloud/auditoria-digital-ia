import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "Daniela Silva - AI Digital Audit",
    version: "1.0.0",
  });
}
