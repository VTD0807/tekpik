/**
 * TekPik Service Worker
 * Installs on first visit, persists in browser, tracks all activity on tekpik.in
 * Data is stored in IndexedDB and synced to Firestore when online
 */

const SW_VERSION  = "tekpik-sw-v1";
const DB_NAME     = "tekpik_history";
const DB_VERSION  = 1;
const STORE_NAME  = "events";

// ── Install & activate ────────────────────────────────────────────────────────
self.addEventListener("install",  () => self.skipWaiting());
self.addEventListener("activate", e  => e.waitUntil(self.clients.claim()));

// ── Receive messages from the page ───────────────────────────────────────────
self.addEventListener("message", async e => {
  if (!e.data || !e.data.type) return;
  switch (e.data.type) {
    case "TRACK_EVENT": await storeEvent(e.data.payload); break;
    case "SYNC_NOW":    await syncToFirestore(); break;
  }
});

// ── Background sync when back online ─────────────────────────────────────────
self.addEventListener("sync", e => {
  if (e.tag === "tp-sync") e.waitUntil(syncToFirestore());
});

// ── IndexedDB helpers ─────────────────────────────────────────────────────────
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
        store.createIndex("synced",     "synced",     { unique: false });
        store.createIndex("visitor_id", "visitor_id", { unique: false });
        store.createIndex("timestamp",  "timestamp",  { unique: false });
        store.createIndex("event_type", "event_type", { unique: false });
      }
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}

async function storeEvent(payload) {
  const db    = await openDB();
  const tx    = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  store.add({ ...payload, synced: false, stored_at: Date.now() });
  return new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = rej; });
}

async function getUnsyncedEvents() {
  const db    = await openDB();
  const tx    = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  const idx   = store.index("synced");
  return new Promise((res, rej) => {
    const req = idx.getAll(false);
    req.onsuccess = e => res(e.target.result);
    req.onerror   = e => rej(e.target.error);
  });
}

async function markSynced(ids) {
  const db    = await openDB();
  const tx    = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  ids.forEach(id => {
    const req = store.get(id);
    req.onsuccess = e => {
      const rec = e.target.result;
      if (rec) { rec.synced = true; store.put(rec); }
    };
  });
  return new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = rej; });
}

// ── Sync to Firestore REST ────────────────────────────────────────────────────
const FB_PROJECT = "tekpik-traffc-sheets";
const FS_BASE    = `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents`;

async function syncToFirestore() {
  const events = await getUnsyncedEvents();
  if (!events.length) return;

  const synced = [];
  for (const ev of events) {
    try {
      // Build Firestore document fields
      const fields = {};
      Object.entries(ev).forEach(([k, v]) => {
        if (k === "id" || k === "synced" || k === "stored_at") return;
        if (typeof v === "boolean")      fields[k] = { booleanValue: v };
        else if (typeof v === "number")  fields[k] = { doubleValue: v };
        else                             fields[k] = { stringValue: String(v||"") };
      });
      fields["_synced"]  = { booleanValue: false };
      fields["_sw"]      = { booleanValue: true }; // flag: came from service worker

      const res = await fetch(`${FS_BASE}/user_history`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ fields }),
      });
      if (res.ok) synced.push(ev.id);
    } catch { /* offline — will retry */ }
  }

  if (synced.length) await markSynced(synced);
}
