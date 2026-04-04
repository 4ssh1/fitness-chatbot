import sanitize from "mongo-sanitize";
import { getMongoDb } from "../lib/mongodb";

export async function createOrGetUserByExternalId(userId: string) {
  const db = await getMongoDb();
  const users = db.collection("users");
  const result = await users.findOneAndUpdate(
    { userId: sanitize(userId) }, // sanitize strips $ and . operators
    { $setOnInsert: { userId: sanitize(userId) } },
    { upsert: true, returnDocument: "after" }
  );
  return result;
}

export async function getUserByExternalId(userId: string) {
  const db = await getMongoDb();
  const users = db.collection("users");
  return users.findOne({ userId });
}

export async function updateUserGender(userId: string, gender: string) {
  const user = await getUserByExternalId(userId);
  if (!user) return;

  const db = await getMongoDb();
  const users = db.collection("users");
  await users.updateOne({ userId }, { $set: { gender } });
}
