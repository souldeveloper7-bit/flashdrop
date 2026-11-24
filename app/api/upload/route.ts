import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const response = await handleUpload({
      body, request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const p = JSON.parse(clientPayload || "{}");
        if (!/^[a-f0-9]{36}$/.test(p.transferId) || !/^\d{6}$/.test(p.code) ||
            !Number.isInteger(p.index) || p.index < 0 || p.index > 19 ||
            !pathname.startsWith(`flashdrop/${p.transferId}/`)) throw new Error("Invalid upload request.");
        return { addRandomSuffix: false, tokenPayload: JSON.stringify(p) };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const p = JSON.parse(tokenPayload || "{}");
        const manifest = { transferId:p.transferId, code:p.code, expiresAt:p.expiresAt,
          index:p.index, name:p.name, url:blob.url, size:blob.size, pathname:blob.pathname };
        await put(`flashdrop/${p.transferId}/file-${String(p.index).padStart(2,"0")}.json`,
          JSON.stringify(manifest), { access:"public", addRandomSuffix:false, allowOverwrite:true,
          contentType:"application/json" });
      }
    });
    return NextResponse.json(response);
  } catch (e) {
    return NextResponse.json({ error:e instanceof Error ? e.message : "Upload authorization failed." }, { status:400 });
  }
}
