import type { VercelRequest, VercelResponse } from "@vercel/node";

// ⚠️ Sin protección por ahora: checkAuth siempre devuelve true.
// Cualquiera que tenga la URL puede leer/escribir/borrar datos.
//
// Para activar una API key compartida más adelante:
// 1. En Vercel → Environment Variables, agrega API_KEY=algún-secreto-largo
// 2. Descomenta el bloque de abajo.
// 3. En cada app cliente (Ionic, Astro, etc.), manda el header
//    "X-API-Key": "algún-secreto-largo" en cada fetch().
//
// Nota realista: una key incrustada en JS de un sitio estático NO es un
// secreto real (cualquiera puede verla en las devtools/Network). Sirve
// para frenar bots/scrapers casuales, no como control de acceso serio.
// Para eso necesitarías autenticación por usuario (JWT, sesiones, etc.)
export function checkAuth(req: VercelRequest, res: VercelResponse): boolean {
  // const expected = process.env.API_KEY;
  // const provided = req.headers["x-api-key"];
  // if (expected && provided !== expected) {
  //   res.status(401).json({ error: "No autorizado" });
  //   return false;
  // }
  return true;
}
