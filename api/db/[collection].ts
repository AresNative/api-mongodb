import pusher, { notifyChange } from "../_lib/pusher";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ObjectId, Document } from "mongodb";
import clientPromise from "../_lib/mongodb";
import { applyCors } from "../_lib/cors";
import { checkAuth } from "../_lib/auth";

// Nombres de colección válidos: letras, números, guion y guion bajo.
const COLLECTION_NAME_RE = /^[a-zA-Z0-9_-]+$/;

function toEntity(doc: Document) {
  const { _id, ...rest } = doc;
  return { ...rest, id: _id.toString() };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return; // preflight OPTIONS ya respondido
  if (!checkAuth(req, res)) return; // no-op mientras no actives API_KEY

  const { collection, id, ...filters } = req.query;

  if (typeof collection !== "string" || !COLLECTION_NAME_RE.test(collection)) {
    return res.status(400).json({ error: "Nombre de colección inválido" });
  }

  try {
    const client = await clientPromise;
    const col = client.db().collection(collection);

    switch (req.method) {
      case "GET": {
        if (id) {
          if (typeof id !== "string" || !ObjectId.isValid(id)) {
            return res.status(400).json({ error: "id inválido" });
          }
          const doc = await col.findOne({ _id: new ObjectId(id) });
          return res.status(200).json(doc ? toEntity(doc) : null);
        }

        // Cada query param restante se usa como filtro de igualdad exacta.
        const filter: Document = {};
        for (const [key, value] of Object.entries(filters)) {
          if (typeof value === "string") filter[key] = value;
        }
        const docs = await col.find(filter).limit(200).toArray();
        return res.status(200).json(docs.map(toEntity));
      }

      case "POST": {
        const body = req.body || {};
        const result = await col.insertOne({ ...body, createdAt: new Date() });
        await notifyChange(
          collection,
          "created",
          result.insertedId.toString(),
          body,
        );
        return res.status(201).json({ id: result.insertedId.toString() });
      }

      case "PUT": {
        if (typeof id !== "string" || !ObjectId.isValid(id)) {
          return res.status(400).json({ error: "id requerido y válido" });
        }
        const body = req.body || {};
         const updatedDoc = await col.findOne({ _id: new ObjectId(id) });
        await col.updateOne(
          { _id: new ObjectId(id) },
          { $set: { ...body, updatedAt: new Date() } },
        );
        await notifyChange(
          collection,
          "updated",
          id,
          updatedDoc ? toEntity(updatedDoc) : null,
        );
        return res.status(204).end();
      }

      case "DELETE": {
        if (typeof id !== "string" || !ObjectId.isValid(id)) {
          return res.status(400).json({ error: "id requerido y válido" });
        }
         const deletedDoc = await col.findOne({ _id: new ObjectId(id) });
        await col.deleteOne({ _id: new ObjectId(id) });

        await notifyChange(
          collection,
          "deleted",
          id,
          deletedDoc ? toEntity(deletedDoc) : null,
        );
        return res.status(204).end();
      }

      default:
        res.setHeader("Allow", "GET, POST, PUT, DELETE, OPTIONS");
        return res.status(405).json({ error: "Método no permitido" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno" });
  }
}
