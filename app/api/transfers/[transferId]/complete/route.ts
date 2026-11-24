import { NextRequest, NextResponse } from "next/server";
import { list } from "@vercel/blob";
export const runtime = "nodejs";
export async function POST(req: NextRequest, ctx: {params: Promise<{transferId:string}>}) {
  try {
    const {transferId} = await ctx.params;
    if (!/^[a-f0-9]{36}$/.test(transferId)) return NextResponse.json({error:"Invalid transfer."},{status:400});
    const {expectedCount} = await req.json();
    const {blobs} = await list({prefix:`flashdrop/${transferId}/file-`});
    const manifests = blobs.filter(b=>b.pathname.endsWith(".json"));
    if (manifests.length !== expectedCount) return NextResponse.json({error:"Not all files finished uploading. Please retry."},{status:409});
    return NextResponse.json({count:manifests.length});
  } catch (e) {
    console.error(e);
    return NextResponse.json({error:"Could not verify uploaded files."},{status:500});
  }
}
