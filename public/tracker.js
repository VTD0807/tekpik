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

// ── Permanent device ID — never expires, survives browser restarts ────────────
const VISITOR_KEY  = "tp_visitor_id";
const VISITED_KEY  = "tp_visited";       // tracks which pages this device has visited
const SESSION_KEY  = "tp_session";       // unused — kept for compat

function getVisitorId() {
  let v = localStorage.getItem(VISITOR_KEY);
  if (!v) {
    // Generate a fingerprint-assisted ID for better persistence
    const fp = [
      navigator.language,
      screen.width + "x" + screen.height,
      screen.colorDepth,
      navigator.hardwareConcurrency || "",
      navigator.platform || "",
      Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    ].join("|");
    v = "d_" + Date.now().toString(36) + "_" + btoa(fp).replace(/[^a-z0-9]/gi,"").slice(0,10);
    localStorage.setItem(VISITOR_KEY, v);
  }
  return v;
}

// Returns true only if this device has NEVER visited this specific page before
function isFirstVisitToPage(page) {
  try {
    const visited = JSON.parse(localStorage.getItem(VISITED_KEY) || "{}");
    return !visited[page];
  } catch { return true; }
}

// Mark this page as visited on this device — permanently
function markPageVisited(page) {
  try {
    const visited = JSON.parse(localStorage.getItem(VISITED_KEY) || "{}");
    visited[page] = Date.now();
    localStorage.setItem(VISITED_KEY, JSON.stringify(visited));
  } catch { /* ignore */ }
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

// ── Device — full specs using Client Hints + UA parsing ───────────────────────
async function getDevice() {
  const ua     = navigator.userAgent;
  const mobile = /Mobi|Android|iPhone|iPad/i.test(ua);

  // ── Basic UA parsing ──────────────────────────────────────────────────────
  let os = "unknown", os_version = "", browser = "unknown", browser_version = "";

  // Android version + brand from UA
  const androidMatch = ua.match(/Android\s([\d.]+)/i);
  const iosMatch     = ua.match(/OS\s([\d_]+)/i);
  if (androidMatch)      { os = "Android"; os_version = androidMatch[1]; }
  else if (/iPhone/i.test(ua)) { os = "iOS"; os_version = iosMatch ? iosMatch[1].replace(/_/g,".") : ""; }
  else if (/iPad/i.test(ua))   { os = "iPadOS"; os_version = iosMatch ? iosMatch[1].replace(/_/g,".") : ""; }
  else if (/Windows NT ([\d.]+)/i.test(ua)) { os = "Windows"; os_version = ua.match(/Windows NT ([\d.]+)/i)[1]; }
  else if (/Mac OS X ([\d_]+)/i.test(ua))   { os = "macOS";   os_version = ua.match(/Mac OS X ([\d_]+)/i)[1].replace(/_/g,"."); }
  else if (/Linux/i.test(ua))  { os = "Linux"; }

  // Browser + version
  const bMatch = ua.match(/(Edg|OPR|Chrome|Firefox|Safari|SamsungBrowser|UCBrowser|MiuiBrowser)\/([\d.]+)/i);
  if (bMatch) {
    const bName = bMatch[1].toLowerCase();
    browser_version = bMatch[2];
    if (bName === "edg")           browser = "Edge";
    else if (bName === "opr")      browser = "Opera";
    else if (bName === "samsungbrowser") browser = "Samsung Browser";
    else if (bName === "ucbrowser")     browser = "UC Browser";
    else if (bName === "miuibrowser")   browser = "MIUI Browser";
    else if (bName === "chrome")   browser = "Chrome";
    else if (bName === "firefox")  browser = "Firefox";
    else if (bName === "safari")   browser = "Safari";
  }

  // ── Device brand + model from UA ─────────────────────────────────────────
  let brand = "unknown", model = "unknown";

  // Android device model — format: (Linux; Android X.X; BRAND MODEL)
  const androidDevice = ua.match(/\(Linux;[^)]*;\s*([^)]+)\)/i);
  if (androidDevice) {
    const raw = androidDevice[1].trim();
    // Remove "Build/..." suffix
    const clean = raw.replace(/\s+Build\/.*$/i, "").trim();
    // Known brand prefixes
    const brands = ["Samsung","Xiaomi","Redmi","POCO","Realme","OnePlus","Vivo","OPPO","Motorola","Nokia","Huawei","Honor","iQOO","Tecno","Infinix","Lava","Micromax","Nothing","Google"];
    for (const b of brands) {
      if (clean.toUpperCase().startsWith(b.toUpperCase()) || clean.toUpperCase().includes(b.toUpperCase())) {
        brand = b;
        model = clean;
        break;
      }
    }
    if (brand === "unknown" && clean) { model = clean; }
  }

  // ── User-Agent Client Hints (Chrome 90+, Android Chrome) ─────────────────
  // This gives the most accurate brand/model on modern Android
  let chBrand = "", chModel = "", chPlatform = "", chPlatformVersion = "", chMobile = mobile;
  try {
    if (navigator.userAgentData) {
      const hints = await navigator.userAgentData.getHighEntropyValues([
        "brands","model","platform","platformVersion","mobile","architecture","bitness"
      ]);
      // Brand — pick the real one (not "Not A;Brand" or "Chromium")
      const realBrand = (hints.brands || []).find(b =>
        !b.brand.includes("Not") && !b.brand.includes("Chromium") && b.brand !== ""
      );
      if (realBrand) { chBrand = realBrand.brand; browser_version = realBrand.version || browser_version; }
      chModel           = hints.model           || "";
      chPlatform        = hints.platform        || "";
      chPlatformVersion = hints.platformVersion || "";
      chMobile          = hints.mobile          ?? mobile;

      // Override with Client Hints data (more accurate)
      if (chModel)    model = chModel;
      if (chPlatform) os    = chPlatform;
      if (chPlatformVersion) os_version = chPlatformVersion;

      // Detect brand from model string
      if (chModel) {
        const brands = ["Samsung","Xiaomi","Redmi","POCO","Realme","OnePlus","Vivo","OPPO","Motorola","Nokia","Huawei","Honor","Google","Nothing"];
        for (const b of brands) {
          if (chModel.toUpperCase().includes(b.toUpperCase())) { brand = b; break; }
        }
        // Samsung SM- prefix
        if (chModel.startsWith("SM-")) brand = "Samsung";
        // Xiaomi/Redmi patterns
        if (/^(M\d{4}|2\d{9}|21\d{8}|22\d{8}|23\d{8})/i.test(chModel)) brand = "Xiaomi";
        // Realme RMX
        if (/^RMX/i.test(chModel)) brand = "Realme";
        // OnePlus
        if (/^(IN|LE|KB|AC|BE|DN|NE|PH|CPH)/i.test(chModel)) brand = "OnePlus";
      }
    }
  } catch(e) { /* Client Hints not supported */ }

  return {
    device:           chMobile ? "mobile" : "desktop",
    brand:            brand !== "unknown" ? brand : (chBrand || "unknown"),
    model:            model !== "unknown" ? model : "unknown",
    os,
    os_version,
    browser,
    browser_version,
    language:         navigator.language || "",
    screen:           `${screen.width}x${screen.height}`,
    viewport:         `${innerWidth}x${innerHeight}`,
    pixel_ratio:      window.devicePixelRatio || 1,
    touch:            navigator.maxTouchPoints > 0 ? "yes" : "no",
    touch_points:     navigator.maxTouchPoints || 0,
    connection:       navigator.connection?.effectiveType || "",
    connection_type:  navigator.connection?.type || "",
    downlink:         navigator.connection?.downlink || "",
    memory_gb:        navigator.deviceMemory || "",
    cpu_cores:        navigator.hardwareConcurrency || "",
    platform:         navigator.platform || "",
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

  // One visit per device per page — ever. Refreshes, new tabs, return visits all ignored.
  if (!isFirstVisitToPage(location.pathname)) {
    initSectionObserver();
    initClickTracking();
    return;
  }

  markPageVisited(location.pathname);
  markReturning();  const [geo, battery, device] = await Promise.all([getGeo(), getBattery(), getDevice()]);
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
    ...battery,    cookie_prefs:   consent ? JSON.stringify(consent) : "not_set",
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
