import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors } from "./_lib/cors";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  // Definición OpenAPI 3.0.3
  const spec = {
    openapi: "3.0.3",
    info: {
      title: "API CRUD dinámica sobre MongoDB",
      description:
        "API genérica que expone cualquier colección de MongoDB a través de `/api/db/:collection`.\n" +
        "Soporta operaciones CRUD con filtros por query params (GET) y mutaciones (POST/PUT/DELETE).\n" +
        "**Autenticación:** actualmente desactivada (cualquiera puede acceder). Para activarla, configura `API_KEY` en las variables de entorno y envía el header `X-API-Key`.",
      version: "1.0.0",
    },
    servers: [
      {
        url: process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : "http://localhost:3000",
        description: "Servidor actual (local o Vercel)",
      },
    ],
    paths: {
      "/api/health": {
        get: {
          summary: "Verifica el estado de la API y la conexión a MongoDB",
          responses: {
            "200": {
              description: "Conexión exitosa",
              content: {
                "application/json": {
                  example: { status: "ok", db: "connected" },
                },
              },
            },
            "500": {
              description: "Error de conexión a la base de datos",
              content: {
                "application/json": {
                  example: { status: "error", db: "disconnected" },
                },
              },
            },
          },
        },
      },
      "/api/db/{collection}": {
        get: {
          summary: "Obtener uno o varios documentos",
          description:
            "Si se pasa el parámetro `id`, devuelve un único documento. En caso contrario, devuelve una lista (máx. 200) filtrada por los query params adicionales (igualdad exacta).",
          parameters: [
            {
              name: "collection",
              in: "path",
              required: true,
              description:
                "Nombre de la colección (solo letras, números, guion y guion bajo)",
              schema: { type: "string" },
            },
            {
              name: "id",
              in: "query",
              required: false,
              description: "ID del documento (ObjectId de MongoDB)",
              schema: { type: "string" },
            },
            {
              name: "filtros",
              in: "query",
              required: false,
              description:
                "Cualquier otro parámetro se usa como filtro de igualdad (ej. `?chatId=123`)",
              schema: {
                type: "object",
                additionalProperties: { type: "string" },
              },
              style: "form",
              explode: true,
            },
          ],
          responses: {
            "200": {
              description: "Documento(s) encontrado(s)",
              content: {
                "application/json": {
                  schema: {
                    oneOf: [
                      {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          // resto de campos dinámicos
                        },
                        additionalProperties: true,
                      },
                      {
                        type: "array",
                        items: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                    ],
                  },
                },
              },
            },
            "400": {
              description: "ID inválido o nombre de colección inválido",
            },
            "404": {
              description: "Documento no encontrado (cuando se usa `id`)",
            },
          },
        },
        post: {
          summary: "Crear un nuevo documento",
          description:
            "Inserta un documento en la colección. El campo `createdAt` se añade automáticamente.",
          parameters: [
            {
              name: "collection",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  description:
                    "Campos del documento (sin `_id`, se genera automáticamente)",
                  additionalProperties: true,
                },
                example: {
                  chatId: "123",
                  text: "Hola mundo",
                  userId: "user-456",
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Creado exitosamente",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                    },
                  },
                },
              },
            },
            "400": {
              description: "Nombre de colección inválido o body incorrecto",
            },
          },
        },
        put: {
          summary: "Actualizar un documento existente",
          description:
            "Actualiza los campos enviados en el body. El campo `updatedAt` se añade automáticamente. Requiere el `id` como query param.",
          parameters: [
            {
              name: "collection",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "id",
              in: "query",
              required: true,
              description: "ID del documento a actualizar",
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  description: "Campos a modificar",
                  additionalProperties: true,
                },
              },
            },
          },
          responses: {
            "204": { description: "Actualizado correctamente (sin contenido)" },
            "400": { description: "ID inválido o colección inválida" },
            "404": { description: "Documento no encontrado" },
          },
        },
        delete: {
          summary: "Eliminar un documento",
          parameters: [
            {
              name: "collection",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "id",
              in: "query",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "204": { description: "Eliminado correctamente (sin contenido)" },
            "400": { description: "ID inválido o colección inválida" },
            "404": { description: "Documento no encontrado" },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
        },
      },
    },
    security: [
      {
        ApiKeyAuth: [],
      },
    ],
  };

  res.status(200).json(spec);
}
