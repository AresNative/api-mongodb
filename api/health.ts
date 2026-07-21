// api/health.ts → GET /api/health
import type { VercelRequest, VercelResponse } from "@vercel/node";
import clientPromise from "./_lib/mongodb";
import { applyCors } from "./_lib/cors";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  try {
    const client = await clientPromise;
    await client.db().command({ ping: 1 });
    return res.status(200).json({ status: "ok", db: "connected" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", db: "disconnected" });
  }
}
