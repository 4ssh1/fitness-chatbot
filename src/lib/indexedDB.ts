import { openDB } from "idb";

const DB_NAME = "GbebodyChat";
const STORE_NAME = "guestSessions";
const AUTH_STORE = "authSessions"; 
const DB_VERSION = 3; // bumped for new store

const TAB_KEY = "gbebody_tab_sessions";

function registerTabSession(sessionId: string) {
  try {
    const existing = JSON.parse(sessionStorage.getItem(TAB_KEY) || "[]") as string[];
    if (!existing.includes(sessionId)) {
      sessionStorage.setItem(TAB_KEY, JSON.stringify([...existing, sessionId]));
    }
  } catch {}
}

function getTabSessions(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(TAB_KEY) || "[]") as string[];
  } catch {
    return [];
  }
}

let dbPromise: ReturnType<typeof openDB> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        // v1 → v2: recreate guest store with sessionId key
        if (oldVersion < 2 && db.objectStoreNames.contains(STORE_NAME)) {
          db.deleteObjectStore(STORE_NAME);
        }
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
        // v3: add auth session cache store
        if (!db.objectStoreNames.contains(AUTH_STORE)) {
          db.createObjectStore(AUTH_STORE);
        }
      },
    });
  }
  return dbPromise;
}

async function purgeStaleEntries() {
  try {
    const db = await getDB();
    const tabSessions = getTabSessions();
    const allKeys = await db.getAllKeys(STORE_NAME);
    for (const key of allKeys) {
      if (!tabSessions.includes(key as string)) {
        await db.delete(STORE_NAME, key);
      }
    }
  } catch {}
}

let purgeRan = false;
async function purgeOnce() {
  if (purgeRan) return;
  purgeRan = true;
  await purgeStaleEntries();
}

// ── Guest API ─────────────────────────────────────────────────────────────────

export async function saveGuestSession(sessionId: string, messages: any[]) {
  await purgeOnce();
  registerTabSession(sessionId);
  const db = await getDB();
  await db.put(STORE_NAME, messages, sessionId);
}

export async function loadGuestSession(sessionId: string): Promise<any[] | null> {
  await purgeOnce();
  const tabSessions = getTabSessions();
  if (!tabSessions.includes(sessionId)) return null;
  const db = await getDB();
  return (await db.get(STORE_NAME, sessionId)) || null;
}

export async function clearGuestSession(sessionId: string) {
  const db = await getDB();
  await db.delete(STORE_NAME, sessionId);
}

/** Cache messages for an authenticated user's session. */
export async function saveAuthSession(sessionId: string, messages: any[]) {
  try {
    const db = await getDB();
    await db.put(AUTH_STORE, { messages, cachedAt: Date.now() }, sessionId);
  } catch {}
}

export async function loadAuthSession(sessionId: string): Promise<any[] | null> {
  try {
    const db = await getDB();
    const entry = await db.get(AUTH_STORE, sessionId);
    return entry?.messages ?? null;
  } catch {
    return null;
  }
}

export async function clearAuthSession(sessionId: string) {
  try {
    const db = await getDB();
    await db.delete(AUTH_STORE, sessionId);
  } catch {}
}


export async function clearConversations(sessionId?: string) {
  const db = await getDB();
  if (sessionId) {
    await db.delete(STORE_NAME, sessionId);
    await db.delete(AUTH_STORE, sessionId).catch(() => {});
  } else {
    const tx = db.transaction([STORE_NAME, AUTH_STORE], "readwrite");
    await tx.objectStore(STORE_NAME).clear();
    await tx.objectStore(AUTH_STORE).clear();
    await tx.done;
  }
}