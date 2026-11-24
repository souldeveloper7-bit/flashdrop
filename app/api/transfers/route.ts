import { NextRequest, NextResponse } from "next/server";
import { randomBytes, randomInt } from "crypto";
export const runtime = "nodejs";
const TTL = 7 * 24 * 60 * 60 * 1000;
export async function POST(req: NextRequest) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) return NextResponse.json({error:"Connect a Vercel Blob store first."},{status:500});
    const body = await req.json();
    if (!Number.isInteger(body.count) || body.count < 1 || body.count > 20)
      return NextResponse.json({error:"Choose between 1 and 20 files."},{status:400});
    return NextResponse.json({
      transferId:randomBytes(18).toString("hex"),
      code:String(randomInt(0,1000000)).padStart(6,"0"),
      expiresAt:Date.now()+TTL
    });
  } catch { return NextResponse.json({error:"Could not start transfer."},{status:400}); }
}
