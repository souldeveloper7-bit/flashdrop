
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const tokenPayload = request.headers.get("x-upload-payload");

    if (!tokenPayload) {
      return NextResponse.json(
        { error: "Missing upload payload" },
        { status: 400 }
      );
    }

    let p: any;

    try {
      p = JSON.parse(tokenPayload);
    } catch {
      return NextResponse.json(
        { error: "Invalid upload payload" },
        { status: 400 }
      );
    }

    if (
      !p.transferId ||
      !p.code ||
      !p.expiresAt ||
      typeof p.index !== "number" ||
      !p.name ||
      typeof p.size !== "number" ||
      !p.pathname
    ) {
      return NextResponse.json(
        { error: "Invalid upload metadata" },
        { status: 400 }
      );
    }

    const blob = await put(
      `flashdrop/${p.transferId}/file-${String(p.index).padStart(2, "0")}.json`,
      JSON.stringify({
        transferId: p.transferId,
        code: p.code,
        expiresAt: p.expiresAt,
        index: p.index,
        name: p.name,
        url: p.url,
        size: p.size,
        pathname: p.pathname,
      }),
      {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
      }
    );

    return NextResponse.json({
      success: true,
      url: blob.url,
      pathname: blob.pathname,
      size: p.size,
    });
  } catch (error) {
    console.error("Upload route error:", error);

    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
