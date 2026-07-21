import type { VercelRequest, VercelResponse } from "@vercel/node";

// ALLOWED_ORIGINS: opcional, lista separada por comas
// (ej: "https://mi-app-ionic.vercel.app,https://mi-blog-astro.com").
// Si no se define, se permite cualquier origen ("*") — cómodo para
// desarrollar/prototipar rápido con varios sitios, pero considera
// restringirlo cuando tengas dominios de producción definidos.
export function applyCors(req: VercelRequest, res: VercelResponse): boolean {
  const allowed = process.env.ALLOWED_ORIGINS;
  const origin = req.headers.origin as string | undefined;

  if (allowed) {
    const list = allowed.split(",").map((o) => o.trim());
    if (origin && list.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-API-Key");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true; // el handler debe hacer `return` inmediatamente si esto es true
  }
  return false;
}
