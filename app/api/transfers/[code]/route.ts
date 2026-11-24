import { NextResponse } from "next/server";
import { list } from "@vercel/blob";
export const runtime = "nodejs";
export async function GET(_req: Request, ctx: {params: Promise<{code:string}>}) {
  try {
    const {code} = await ctx.params;
    if (!/^\d{6}$/.test(code)) return NextResponse.json({error:"Enter a valid 6-digit code."},{status:400});
    const {blobs} = await list({prefix:"flashdrop/"});
    const manifests = blobs.filter(b=>/\/file-\d{2}\.json$/.test(b.pathname));
    for (const b of manifests) {
      const r = await fetch(b.url,{cache:"no-store"}); if (!r.ok) continue;
      const item = await r.json();
      if (item.code === code) {
        if (Date.now() > item.expiresAt) return NextResponse.json({error:"This transfer has expired."},{status:410});
        const siblings = manifests.filter(x=>x.pathname.startsWith(`flashdrop/${item.transferId}/`));
        const files = [];
        for (const sibling of siblings) {
          const sr = await fetch(sibling.url,{cache:"no-store"});
          if (sr.ok) { const f = await sr.json(); files.push({url:f.url,name:f.name,size:f.size}); }
        }
        return NextResponse.json({files});
      }
    }
    return NextResponse.json({error:"Code not found or expired."},{status:404});
  } catch (e) {
    console.error(e);
    return NextResponse.json({error:"Could not look up this code."},{status:500});
  }
}
