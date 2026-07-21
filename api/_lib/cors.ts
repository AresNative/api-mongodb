import type { VercelRequest, VercelResponse } from "@vercel/node";

export function applyCors(req: VercelRequest, res: VercelResponse): boolean {
  // api/_lib/cors.ts
  const allowed =
    process.env.ALLOWED_ORIGINS || "https://api-mongodb.mercadosliz.com, http://localhost:3001";
  const origin = req.headers.origin as string | undefined;
  console.log("ALLOWED_ORIGINS:", process.env.ALLOWED_ORIGINS);
  if (allowed) {
    const list = allowed.split(",").map((o) => o.trim());
    if (origin && list.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-API-Key");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true; // el handler debe hacer `return` inmediatamente si esto es true
  }
  return false;
}
