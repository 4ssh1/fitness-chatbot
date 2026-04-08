import { openDB } from "idb";

const DB_NAME = "GbebodyChat";
const STORE_NAME = "guestSessions";
const DB_VERSION = 1;

let dbPromise: ReturnType<typeof openDB> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
}

export async function saveGuestSession(category: string, messages: any[]) {
  const db = await getDB();
  await db.put(STORE_NAME, messages, category);
}

export async function loadGuestSession(
  category: string
): Promise<any[] | null> {
  const db = await getDB();
  return (await db.get(STORE_NAME, category)) || null;
}

export async function clearConversations(category?: string) {
  const db = await getDB();
  if (category) {
    await db.delete(STORE_NAME, category);
  } else {
    const tx = db.transaction(STORE_NAME, "readwrite");
    await tx.objectStore(STORE_NAME).clear();
    await tx.done;
  }
}