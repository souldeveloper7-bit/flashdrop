import { NextRequest, NextResponse } from "next/server";
import { del, list } from "@vercel/blob";
export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`)
    return NextResponse.json({error:"Unauthorized"},{status:401});
  try {
    const {blobs} = await list({prefix:"flashdrop/"});
    const manifests = blobs.filter(b=>/\/file-\d{2}\.json$/.test(b.pathname));
    const expired = new Set<string>();
    for (const b of manifests) {
      const r = await fetch(b.url,{cache:"no-store"});
      if (!r.ok) continue;
      const item = await r.json();
      if (Date.now() > item.expiresAt) expired.add(item.transferId);
    }
    let deleted = 0;
    for (const id of expired) {
      const group = await list({prefix:`flashdrop/${id}/`});
      if (group.blobs.length) {
        await del(group.blobs.map(b=>b.url));
        deleted += group.blobs.length;
      }
    }
    return NextResponse.json({expiredTransfers:expired.size,deletedBlobs:deleted});
  } catch (e) {
    console.error(e);
    return NextResponse.json({error:"Cleanup failed."},{status:500});
  }
}
