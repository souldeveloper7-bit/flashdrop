import { NextRequest, NextResponse } from "next/server";
import { handleUpload } from "@vercel/blob/client";

export const runtime = "nodejs";

type UploadPayload = {
  transferId: string;
  code: string;
  expiresAt: number;
  index: number;
  name: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        if (!clientPayload) {
          throw new Error("Missing upload metadata.");
        }

        let payload: Partial<UploadPayload>;

        try {
          payload = JSON.parse(clientPayload) as Partial<UploadPayload>;
        } catch {
          throw new Error("Invalid upload metadata.");
        }

        if (
          typeof payload.transferId !== "string" ||
          !/^[a-f0-9]{36}$/.test(payload.transferId) ||
          typeof payload.code !== "string" ||
          !/^\d{6}$/.test(payload.code) ||
          typeof payload.expiresAt !== "number" ||
          typeof payload.index !== "number" ||
          !Number.isInteger(payload.index) ||
          payload.index < 0 ||
          typeof payload.name !== "string"
        ) {
          throw new Error("Invalid upload metadata.");
        }

        return {
          tokenPayload: JSON.stringify(payload),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        if (!tokenPayload) {
          throw new Error("Missing upload metadata after upload.");
        }

        const payload = JSON.parse(tokenPayload) as UploadPayload;

        // Save a manifest that the transfer lookup API can find by code.
        const { put } = await import("@vercel/blob");

        await put(
          `flashdrop/${payload.transferId}/file-${String(payload.index).padStart(2, "0")}.json`,
          JSON.stringify({
            transferId: payload.transferId,
            code: payload.code,
            expiresAt: payload.expiresAt,
            index: payload.index,
            name: payload.name,
            url: blob.url,
            pathname: blob.pathname,
          }),
          {
            access: "public",
            addRandomSuffix: false,
            allowOverwrite: true,
            contentType: "application/json",
          }
        );
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Upload route error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Upload failed. Please try again.",
      },
      { status: 400 }
    );
  }
}
