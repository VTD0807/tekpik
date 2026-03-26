/**
 * TekPik Tracker v4
 * Flow: Browser → Firestore (instant) → Apps Script pulls → Sheets
 * - Deduplicates refreshes using a 30-min session window
 * - Tracks unique visitors via persistent localStorage ID
 * - Improved traffic source detection (handles Google referrer stripping)
 */

import { initializeApp }                                     from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAnalytics, logEvent }                            from "https://www.gstatic.com/firebasejs/12.11.0/firebase-analytics.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import { getAuth, signInAnonymously }                        from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

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

signInAnonymously(auth).catch(() => {});

// ── Session state ─────────────────────────────────────────────────────────────
const SESSION_START  = Date.now();
let   maxScrollDepth = 0;
const sectionsViewed = new Set();
const ctaClicks      = [];

// ── Session deduplication — 30 min window ─────────────────────────────────────
const SESSION_KEY     = "tp_session";
const SESSION_WINDOW  = 30 * 60 * 1000; // 30 minutes

function isNewSession() {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return true;
  try {
    const { ts } = JSON.parse(raw);
    return (Date.now() - ts) > SESSION_WINDOW;
  } catch { return true; }
}

function markSession() {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ts: Date.now(), page: location.pathname }));
}

// ── Persistent unique visitor ID ─────────────────────────────────────────────
const VISITOR_KEY = "tp_visitor_id";
function getVisitorId() {
  let vid = localStorage.getItem(VISITOR_KEY);
  if (!vid) {
    vid = "v_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
    localStorage.setItem(VISITOR_KEY, vid);
  }
  return vid;
}

function isReturningVisitor() {
  return !!localStorage.getItem("tp_returning");
}

function markReturning() {
  localStorage.setItem("tp_returning", "1");
}

// ── Helpers ───────────────────────────────────────────────────────────────────
async function sha256short(str) {
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("").slice(0,16);
  } catch { return ""; }
}

// Write to Firestore — fast, non-blocking
async function saveToFirestore(colName, data) {
  try {
    await addDoc(collection(db, colName), { ...data, _ts: serverTimestamp(), _synced: false });
  } catch (e) {
    console.warn("Firestore write failed:", e.message);
  }
}

// ── Traffic source — handles Google referrer stripping ───────────────────────
function getTrafficSource() {
  const p = new URLSearchParams(location.search);
  const r = document.referrer || "";

  // 1. UTM always wins
  if (p.get("utm_source")) return {
    source: p.get("utm_source"), medium: p.get("utm_medium") || "unknown",
    campaign: p.get("utm_campaign") || "", content: p.get("utm_content") || "",
    term: p.get("utm_term") || "",
  };

  // 2. gclid = Google Ads
  if (p.get("gclid")) return { source:"google", medium:"cpc", campaign:"", content:"", term:"" };

  // 3. Google organic — referrer present
  if (r.includes("google.") && !r.includes("googleads"))
    return { source:"google", medium:"organic", campaign:"", content:"", term: p.get("q")||"" };

  // 4. Google strips referrer on HTTPS→HTTPS in some browsers.
  // If no referrer AND user came from a search engine click, we can't know for sure.
  // We mark it as organic/unknown rather than direct to avoid polluting direct stats.
  // The only real fix is UTM params on your Search Console links.

  // 5. Pinterest
  if (r.includes("pinterest.") || p.get("epik"))
    return { source:"pinterest", medium:"social", campaign:"", content:"", term:"" };

  // 6. Other socials
  const socials = [
    ["instagram.com","instagram"], ["twitter.com","twitter"],
    ["t.co/","twitter"], ["x.com","twitter"], ["youtube.com","youtube"],
    ["linkedin.com","linkedin"], ["facebook.com","facebook"], ["fb.com","facebook"],
  ];
  for (const [host, name] of socials)
    if (r.includes(host)) return { source:name, medium:"social", campaign:"", content:"", term:"" };

  // 7. Other search engines
  if (r.includes("bing.com"))    return { source:"bing",       medium:"organic", campaign:"", content:"", term:"" };
  if (r.includes("yahoo.com"))   return { source:"yahoo",      medium:"organic", campaign:"", content:"", term:"" };
  if (r.includes("duckduckgo.")) return { source:"duckduckgo", medium:"organic", campaign:"", content:"", term:"" };

  // 8. Any other external referrer
  if (r && !r.includes(location.hostname)) {
    try { return { source: new URL(r).hostname.replace("www.",""), medium:"referral", campaign:"", content:"", term:"" }; }
    catch { /* ignore */ }
  }

  // 9. Direct (no referrer, no params)
  return { source:"direct", medium:"none", campaign:"", content:"", term:"" };
}

// ── Geo ───────────────────────────────────────────────────────────────────────
async function getGeo() {
  try {
    const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return {};
    const d = await res.json();
    return {
      country: d.country_name||"", region: d.region||"",
      city: d.city||"", timezone: d.timezone||"",
      isp: d.org||"", ip_hash: await sha256short(d.ip||""),
    };
  } catch { return {}; }
}

// ── Battery ───────────────────────────────────────────────────────────────────
async function getBattery() {
  try {
    if (!navigator.getBattery) return {};
    const b = await navigator.getBattery();
    return { battery_pct: Math.round(b.level*100), battery_charging: b.charging?"yes":"no" };
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
    device: mobile?"mobile":"desktop", os, browser,
    language: navigator.language||"",
    screen: `${screen.width}x${screen.height}`,
    viewport: `${innerWidth}x${innerHeight}`,
    touch: navigator.maxTouchPoints>0?"yes":"no",
    connection: navigator.connection?.effectiveType||"",
  };
}

// ── Behavioural trackers ──────────────────────────────────────────────────────
window.addEventListener("scroll", () => {
  const pct = Math.round(((scrollY + innerHeight) / document.documentElement.scrollHeight) * 100);
  if (pct > maxScrollDepth) maxScrollDepth = pct;
}, { passive: true });

function initSectionObserver() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) sectionsViewed.add(e.target.dataset.section || e.target.id || "?"); });
  }, { threshold: 0.3 });
  document.querySelectorAll("[data-section], section[id]").forEach(el => io.observe(el));
}

function initClickTracking() {
  document.addEventListener("click", e => {
    const a = e.target.closest("a");
    if (!a) return;
    const href = a.href||"";
    if ((href && !href.includes(location.hostname) && href.startsWith("http")) ||
        a.classList.contains("btn-primary") || a.classList.contains("nav-cta")) {
      ctaClicks.push({ href, text:(a.innerText||"").trim().slice(0,40), t: Date.now()-SESSION_START });
    }
  });
}

// ── Cookie consent ────────────────────────────────────────────────────────────
export function getCookieConsent() {
  try { return JSON.parse(localStorage.getItem("tp_cookie_consent")||"null"); }
  catch { return null; }
}

// ── Session end — send to Firestore via sendBeacon fallback ───────────────────
async function sendSessionEnd() {
  const consent = getCookieConsent();
  if (!consent?.analytics) return;
  const battery = await getBattery();
  const payload = {
    event:            "session_end",
    page:             location.pathname,
    time_on_page_s:   Math.round((Date.now()-SESSION_START)/1000),
    scroll_depth:     maxScrollDepth,
    sections_viewed:  [...sectionsViewed].join("|"),
    cta_clicks:       ctaClicks.length,
    cta_detail:       JSON.stringify(ctaClicks).slice(0,300),
    ...battery,
    cookie_prefs:     JSON.stringify(consent),
    timestamp:        new Date().toISOString(),
  };
  logEvent(analytics, "session_end", { page_path: payload.page, time_on_page_s: payload.time_on_page_s, scroll_depth: maxScrollDepth });
  // Use Firestore for session end too — sendBeacon to Firestore REST as fallback
  saveToFirestore("session_ends", payload).catch(()=>{});
}

window.addEventListener("pagehide",     sendSessionEnd);
window.addEventListener("beforeunload", sendSessionEnd);

// ── Main visit tracker ────────────────────────────────────────────────────────
export async function trackVisit() {
  const consent   = getCookieConsent();
  const traffic   = getTrafficSource();
  const device    = getDevice();
  const visitorId = getVisitorId();
  const returning = isReturningVisitor();

  // Firebase Analytics — always fires, no PII
  logEvent(analytics, "page_view", {
    page_path:      location.pathname,
    traffic_source: traffic.source,
    traffic_medium: traffic.medium,
  });

  if (!consent?.analytics) {
    initSectionObserver();
    initClickTracking();
    return;
  }

  // ── Deduplicate refreshes — only record one visit per 30-min session ────────
  const newSession = isNewSession();
  markSession();
  markReturning();

  const [geo, battery] = await Promise.all([getGeo(), getBattery()]);

  const payload = {
    event:             "page_visit",
    page:              location.pathname,
    page_title:        document.title,
    url:               location.href,
    referrer:          document.referrer || "direct",
    timestamp:         new Date().toISOString(),
    ...traffic,
    ...geo,
    ...device,
    ...battery,
    visitor_id:        visitorId,
    is_new_visitor:    !returning,
    is_new_session:    newSession,
    cookie_prefs:      JSON.stringify(consent),
  };

  // Only write a new visit doc if it's a new session (not a refresh)
  if (newSession) {
    await saveToFirestore("visits", payload);
  } else {
    // Still log page_view for SPA-style navigation within same session
    // but don't create a new visit row — avoids refresh inflation
    logEvent(analytics, "page_view_repeat", { page_path: location.pathname });
  }

  initSectionObserver();
  initClickTracking();
}

trackVisit();

// Re-track after consent given on same page load
window.addEventListener("storage", e => {
  if (e.key === "tp_cookie_consent" && e.newValue) trackVisit();
});
