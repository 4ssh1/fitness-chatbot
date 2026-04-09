import { MongoClient } from "mongodb";

const DATABASE_URL = process.env.DATABASE_URL!;
const DB_NAME = process.env.MONGODB_DB_NAME!;

if (!DATABASE_URL) {
  throw new Error("Please define the DATABASE_URL environment variable");
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(DATABASE_URL);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(DATABASE_URL);
  clientPromise = client.connect();
}

export { clientPromise };

export async function getMongoDb() {
  const mongoClient = await clientPromise;
  return mongoClient.db(DB_NAME);
}