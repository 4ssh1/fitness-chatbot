import { openDB } from "idb";

const DB_NAME = "GbebodyChat";
const STORE_NAME = "sessions";
const DB_VERSION = 4;

let dbPromise: ReturnType<typeof openDB> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        for (const name of Array.from(db.objectStoreNames)) {
          db.deleteObjectStore(name);
        }
        db.createObjectStore(STORE_NAME);
      },
    });
  }
  return dbPromise;
}


export async function saveGuestSession(category: string, messages: any[]) {
  try {
    const db = await getDB();
    await db.put(STORE_NAME, messages, `guest:${category}`);
  } catch {}
}

export async function loadGuestSession(category: string): Promise<any[] | null> {
  try {
    const db = await getDB();
    return (await db.get(STORE_NAME, `guest:${category}`)) ?? null;
  } catch {
    return null;
  }
}

export async function deleteGuestSession(category: string) {
  try {
    const db = await getDB();
    await db.delete(STORE_NAME, `guest:${category}`);
  } catch {}
}

export async function clearAllSessions() {
  try {
    const db = await getDB();
    await db.clear(STORE_NAME);
  } catch {}
}