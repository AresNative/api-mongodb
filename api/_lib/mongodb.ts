import { MongoClient } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI;
const options: any = {
  appName: "mongo-api.vercel",
  maxIdleTimeMS: 5000,
};

if (!uri) {
  throw new Error("Falta MONGODB_URI en las variables de entorno");
}

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  // Evita abrir una conexión nueva en cada invocación durante `vercel dev`.
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = new MongoClient(uri, options).connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  clientPromise = new MongoClient(uri, options).connect();
}

export default clientPromise;
