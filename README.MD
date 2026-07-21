# mongo-api

API genérica para MongoDB, desplegable en Vercel, pensada para que **varios
proyectos distintos** (Ionic, Astro, lo que sea) la consuman por HTTP sin
que ninguno de ellos tenga que importar el driver de `mongodb` directamente
(cosa que además es imposible en apps que corren en el navegador).

## Deploy

```bash
npm install
vercel link          # conecta esta carpeta a un proyecto de Vercel
vercel env add MONGODB_URI production
vercel env add MONGODB_URI preview
vercel env add MONGODB_URI development
vercel --prod
```

Tu API queda en algo como `https://mongo-api-tuusuario.vercel.app`.

## Desarrollo local

```bash
vercel dev
```

Esto levanta las funciones de `/api` en `http://localhost:3001` (o el puerto
que te asigne), usando el `MONGODB_URI` que hayas puesto para `development`.

## Endpoints

### `GET /api/health`
Verifica que la API está viva y conectada a Mongo.

### `GET /api/db/:collection`
Lista documentos. Cualquier query param extra se usa como filtro de
igualdad exacta.
```
GET /api/db/messages?chatId=chat_5551234567_99
GET /api/db/users
```

### `GET /api/db/:collection?id=...`
Un documento por id.
```
GET /api/db/messages?id=676f1a2b3c4d5e6f7a8b9c0d
```

### `POST /api/db/:collection`
Crea un documento. El body es el documento (se le agrega `createdAt`
automáticamente).
```js
fetch("https://mongo-api-tuusuario.vercel.app/api/db/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    chatId: "chat_5551234567_99",
    text: "Hola",
    userId: "u1",
    userName: "Soporte",
  }),
});
```

### `PUT /api/db/:collection?id=...`
Actualiza (merge) un documento. El body son los campos a cambiar
(se le agrega `updatedAt` automáticamente).

### `DELETE /api/db/:collection?id=...`
Borra un documento.

## Cómo llamarla desde Ionic React (Vite)

```ts
// src/hooks/reducers/chat-actions.ts
const API_URL = import.meta.env.VITE_MONGO_API_URL; // https://mongo-api-tuusuario.vercel.app

export async function getMessages(chatId: string) {
  const res = await fetch(`${API_URL}/api/db/messages?chatId=${encodeURIComponent(chatId)}`);
  return res.json();
}
```
Agrega `VITE_MONGO_API_URL=https://mongo-api-tuusuario.vercel.app` en el
`.env` de la app Ionic.

## Cómo llamarla desde Astro

```astro
---
// cualquier .astro, funciona tanto en server-side render como client:script
const res = await fetch(`${import.meta.env.PUBLIC_MONGO_API_URL}/api/db/posts`);
const posts = await res.json();
---
```
En Astro las env vars públicas para el cliente deben empezar con `PUBLIC_`.

## Seguridad — pendiente de decisión tuya

Ahora mismo **no hay ninguna protección**: cualquiera con la URL puede leer,
crear, modificar o borrar documentos de cualquier colección. Cuando quieras
cerrar esto:

1. Restringe `ALLOWED_ORIGINS` en `.env` (ver `.env.example`) para que solo
   tus dominios puedan llamar la API desde el navegador (esto no detiene
   `curl`/Postman, solo llamadas `fetch` desde otros sitios web).
2. Descomenta el bloque de `api/_lib/auth.ts` y define `API_KEY` — cada app
   cliente tendría que mandar el header `X-API-Key`. Recuerda: una key
   metida en JS de un sitio estático es visible para cualquiera que abra
   las devtools; sirve para frenar abuso casual, no como autenticación real.
3. Si necesitas seguridad de verdad (datos sensibles, usuarios reales),
   lo correcto es autenticación por usuario (JWT/sesión) y reglas de acceso
   por colección/documento, no una key compartida.