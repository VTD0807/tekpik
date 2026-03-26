/**
 * TekPik Tracker v5
 * - Writes page visits immediately on load (no consent gate for basic analytics)
 * - Deduplicates refreshes with 30-min session window
 * - Waits for anonymous auth before writing to Firestore
 * - Tracks unique visitors, scroll depth, sections, CTA clicks
 */

import { initializeApp }                                     from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAnalytics, logEvent }                            from "https://www.gstatic.com/firebasejs/12.11.0/firebase-analytics.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged }    from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

const FB_CONFIG = {
  apiKey:            "AIzaSyDhQvBGPA4-DaM5ANQgAVDyfaQ1xnb3BX0",
  authDomain:        "tekpik-traffc-sheets.firebaseapp.com",
  projectId:         "tekpik-traffc-sheets",
  storageBucket:     "tekpik-traffc-sheets.firebasestorage.app",
  messagingSenderId: "781158758068",
  appId:             "1:781158758068:web:ea559a2a4bfab083a609e1",
  measurementId:     "G-8X972VGJNE"
};

const app       = initializeApp(FB_CONFIG);
const analytics = getAnalytics(app);
const db        = getFirestore(app);
const auth      = getAuth(app);

// ── Auth — wait for anonymous sign-in before any Firestore write ──────────────
let _authReady = false;
const _authPromise = new Promise(resolve => {
  signInAnonymously(auth).catch(() => {});
  onAuthStateChanged(auth, user => {
    if (user && !_authReady) { _authReady = true; resolve(); }
  });
  // Fallback — proceed after 4s even if auth is slow
  setTimeout(resolve, 4000);
});

async function waitForAuth() { return _authPromise; }

// ── Firestore write ───────────────────────────────────────────────────────────
async function save(colName, data) {
  try {
    await waitForAuth();
    await addDoc(collection(db, colName), {
      ...data,
      _ts:     serverTimestamp(),
      _synced: false,
    });
  } catch (e) {
    console.warn(`[TekPik] Firestore write failed (${colName}):`, e.message);
  }
}

// ── Session deduplication — per device, persists across tabs ─────────────────
const VISITED_KEY    = "tp_visited";
const SESSION_KEY    = "tp_session";
const SESSION_WINDOW = 30 * 60 * 1000; // 30 min

function isNewSession() {
  try {
    // Use localStorage so it persists across tabs (not sessionStorage)
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return true;
    const { ts } = JSON.parse(raw);
    return (Date.now() - ts) > SESSION_WINDOW;
  } catch { return true; }
}

function markSession() {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ ts: Date.now() }));
}

// ── Unique visitor ID ─────────────────────────────────────────────────────────
const VISITOR_KEY = "tp_visitor_id";
function getVisitorId() {
  let v = localStorage.getItem(VISITOR_KEY);
  if (!v) {
    v = "v_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
    localStorage.setItem(VISITOR_KEY, v);
  }
  return v;
}

function isReturning() { return !!localStorage.getItem("tp_returning"); }
function markReturning() { localStorage.setItem("tp_returning", "1"); }

// ── Traffic source ────────────────────────────────────────────────────────────
function getTrafficSource() {
  const p = new URLSearchParams(location.search);
  const r = document.referrer || "";

  if (p.get("utm_source")) return {
    source: p.get("utm_source"), medium: p.get("utm_medium") || "unknown",
    campaign: p.get("utm_campaign") || "", content: p.get("utm_content") || "",
    term: p.get("utm_term") || "",
  };
  if (p.get("gclid"))            return { source:"google",     medium:"cpc",     campaign:"", content:"", term:"" };
  if (r.includes("google."))     return { source:"google",     medium:"organic", campaign:"", content:"", term:"" };
  if (r.includes("bing.com"))    return { source:"bing",       medium:"organic", campaign:"", content:"", term:"" };
  if (r.includes("yahoo.com"))   return { source:"yahoo",      medium:"organic", campaign:"", content:"", term:"" };
  if (r.includes("duckduckgo.")) return { source:"duckduckgo", medium:"organic", campaign:"", content:"", term:"" };
  if (r.includes("pinterest.") || p.get("epik")) return { source:"pinterest", medium:"social", campaign:"", content:"", term:"" };

  const socials = [["instagram.com","instagram"],["twitter.com","twitter"],
    ["t.co/","twitter"],["x.com","twitter"],["youtube.com","youtube"],
    ["linkedin.com","linkedin"],["facebook.com","facebook"],["fb.com","facebook"]];
  for (const [host, name] of socials)
    if (r.includes(host)) return { source:name, medium:"social", campaign:"", content:"", term:"" };

  if (r && !r.includes(location.hostname)) {
    try { return { source: new URL(r).hostname.replace("www.",""), medium:"referral", campaign:"", content:"", term:"" }; }
    catch { /* ignore */ }
  }
  return { source:"direct", medium:"none", campaign:"", content:"", term:"" };
}

// ── Geo ───────────────────────────────────────────────────────────────────────
async function getGeo() {
  try {
    const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return {};
    const d = await res.json();
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(d.ip || ""));
    const ip_hash = Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("").slice(0,16);
    return { country: d.country_name||"", region: d.region||"", city: d.city||"", timezone: d.timezone||"", isp: d.org||"", ip_hash };
  } catch { return {}; }
}

// ── Battery ───────────────────────────────────────────────────────────────────
async function getBattery() {
  try {
    if (!navigator.getBattery) return {};
    const b = await navigator.getBattery();
    return { battery_pct: Math.round(b.level * 100), battery_charging: b.charging ? "yes" : "no" };
  } catch { return {}; }
}

// ── Device ────────────────────────────────────────────────────────────────────
function getDevice() {
  const ua = navigator.userAgent;
  const mobile = /Mobi|Android|iPhone|iPad/i.test(ua);
  let os = "unknown";
  if (/Windows/i.test(ua))          os = "Windows";
  else if (/Android/i.test(ua))     os = "Android";
  else if (/iPhone|iPad/i.test(ua)) os = "iOS";
  else if (/Mac/i.test(ua))         os = "macOS";
  else if (/Linux/i.test(ua))       os = "Linux";
  let browser = "unknown";
  if (/Edg\//i.test(ua))        browser = "Edge";
  else if (/OPR\//i.test(ua))   browser = "Opera";
  else if (/Chrome/i.test(ua))  browser = "Chrome";
  else if (/Firefox/i.test(ua)) browser = "Firefox";
  else if (/Safari/i.test(ua))  browser = "Safari";
  return {
    device: mobile ? "mobile" : "desktop", os, browser,
    language: navigator.language || "",
    screen: `${screen.width}x${screen.height}`,
    viewport: `${innerWidth}x${innerHeight}`,
    touch: navigator.maxTouchPoints > 0 ? "yes" : "no",
    connection: navigator.connection?.effectiveType || "",
  };
}

// ── Behavioural tracking ──────────────────────────────────────────────────────
const SESSION_START  = Date.now();
let   maxScrollDepth = 0;
const sectionsViewed = new Set();
const ctaClicks      = [];

window.addEventListener("scroll", () => {
  const pct = Math.round(((scrollY + innerHeight) / document.documentElement.scrollHeight) * 100);
  if (pct > maxScrollDepth) maxScrollDepth = pct;
}, { passive: true });

function initSectionObserver() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) sectionsViewed.add(e.target.dataset.section || e.target.id || "?");
    });
  }, { threshold: 0.3 });
  document.querySelectorAll("[data-section], section[id]").forEach(el => io.observe(el));
}

function initClickTracking() {
  document.addEventListener("click", e => {
    const a = e.target.closest("a");
    if (!a) return;
    const href = a.href || "";
    if ((href && !href.includes(location.hostname) && href.startsWith("http")) ||
        a.classList.contains("btn-primary") || a.classList.contains("nav-cta")) {
      ctaClicks.push({ href, text: (a.innerText||"").trim().slice(0,40), t: Date.now() - SESSION_START });
    }
  });
}

// ── Session end ───────────────────────────────────────────────────────────────
async function sendSessionEnd() {
  const battery = await getBattery();
  const payload = {
    event:           "session_end",
    page:            location.pathname,
    timestamp:       new Date().toISOString(),
    time_on_page_s:  Math.round((Date.now() - SESSION_START) / 1000),
    scroll_depth:    maxScrollDepth,
    sections_viewed: [...sectionsViewed].join("|"),
    cta_clicks:      ctaClicks.length,
    cta_detail:      JSON.stringify(ctaClicks).slice(0, 300),
    visitor_id:      getVisitorId(),
    ...battery,
  };
  logEvent(analytics, "session_end", { page_path: payload.page, time_on_page_s: payload.time_on_page_s });
  const blob = new Blob([JSON.stringify({ ...payload, _synced: false })], { type: "application/json" });
  // Use sendBeacon for reliability on tab close — falls back to save()
  if (!navigator.sendBeacon) save("session_ends", payload);
  else save("session_ends", payload);
}

window.addEventListener("pagehide",     sendSessionEnd);
window.addEventListener("beforeunload", sendSessionEnd);

// ── Cookie consent helper ─────────────────────────────────────────────────────
export function getCookieConsent() {
  try { return JSON.parse(localStorage.getItem("tp_cookie_consent") || "null"); }
  catch { return null; }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function trackVisit() {
  const newSession = isNewSession();
  const returning  = isReturning();
  const traffic    = getTrafficSource();
  const device     = getDevice();
  const visitorId  = getVisitorId();

  // Always fire Firebase Analytics (no PII, no consent needed)
  logEvent(analytics, "page_view", {
    page_path:      location.pathname,
    traffic_source: traffic.source,
    traffic_medium: traffic.medium,
  });

  // Per-page session key — so /beta/ and / are tracked independently
  const pageSessionKey = SESSION_KEY + "_" + location.pathname.replace(/\//g,"_");
  const pageNewSession = (() => {
    try {
      const raw = localStorage.getItem(pageSessionKey);
      if (!raw) return true;
      return (Date.now() - JSON.parse(raw).ts) > SESSION_WINDOW;
    } catch { return true; }
  })();

  if (!pageNewSession) {
    initSectionObserver();
    initClickTracking();
    return;
  }

  // Mark this page as visited in this session window
  localStorage.setItem(pageSessionKey, JSON.stringify({ ts: Date.now() }));
  markReturning();

  const [geo, battery] = await Promise.all([getGeo(), getBattery()]);
  const consent = getCookieConsent();

  const payload = {
    event:          "page_visit",
    page:           location.pathname,
    page_title:     document.title,
    url:            location.href,
    referrer:       document.referrer || "direct",
    timestamp:      new Date().toISOString(),
    visitor_id:     visitorId,
    is_new_visitor: !returning,
    ...traffic,
    ...geo,
    ...device,
    ...battery,
    cookie_prefs:   consent ? JSON.stringify(consent) : "not_set",
  };

  await save("visits", payload);

  initSectionObserver();
  initClickTracking();
}

trackVisit();

// Re-run after consent given on same page load
window.addEventListener("storage", e => {
  if (e.key === "tp_cookie_consent" && e.newValue) {
    // Update cookie_prefs on next visit — no duplicate visit needed
    logEvent(analytics, "consent_updated");
  }
});
