/**
 * TekPik Service Worker Tracker
 * Registers the SW, then sends detailed user activity events to it for
 * persistent storage in IndexedDB → synced to Firestore → USER_HISTORY sheet.
 *
 * Events tracked:
 *   page_view    — every page load
 *   page_exit    — time on page, scroll depth, sections, CTA clicks
 *   link_click   — every link clicked (internal + external)
 *   section_view — when a section becomes 50% visible
 */

// ── Visitor ID (shared with tracker.js via localStorage) ─────────────────────
function _swGetVisitorId() {
  let v = localStorage.getItem("tp_visitor_id");
  if (!v) {
    const fp = [navigator.language, screen.width+"x"+screen.height,
      navigator.hardwareConcurrency||"", navigator.platform||"",
      Intl.DateTimeFormat().resolvedOptions().timeZone||""].join("|");
    v = "d_" + Date.now().toString(36) + "_" + btoa(fp).replace(/[^a-z0-9]/gi,"").slice(0,10);
    localStorage.setItem("tp_visitor_id", v);
  }
  return v;
}

// ── Send event to Service Worker ──────────────────────────────────────────────
function swTrack(eventType, extra) {
  if (!navigator.serviceWorker || !navigator.serviceWorker.controller) return;
  navigator.serviceWorker.controller.postMessage({
    type: "TRACK_EVENT",
    payload: {
      event_type:  eventType,
      visitor_id:  _swGetVisitorId(),
      page:        location.pathname,
      page_title:  document.title,
      url:         location.href,
      referrer:    document.referrer || "direct",
      timestamp:   new Date().toISOString(),
      device:      /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? "mobile" : "desktop",
      language:    navigator.language || "",
      ...extra,
    },
  });
}

// ── Register Service Worker ───────────────────────────────────────────────────
async function initSWTracker() {
  if (!("serviceWorker" in navigator)) return;

  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });

    // Wait for SW to be active before sending first event
    await new Promise(resolve => {
      if (navigator.serviceWorker.controller) { resolve(); return; }
      navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true });
      // Fallback — if SW was already waiting, claim it
      if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
      setTimeout(resolve, 2000);
    });

    // Register background sync
    if ("SyncManager" in window) {
      reg.sync.register("tp-sync").catch(() => {});
    }

    // ── Track page view ───────────────────────────────────────────────────────
    swTrack("page_view", {});

    // ── Track page exit (time, scroll, sections, clicks) ─────────────────────
    let _maxScroll = 0;
    const _sections = new Set();
    const _ctaClicks = [];
    const _pageStart = Date.now();

    window.addEventListener("scroll", () => {
      const pct = Math.round(((scrollY + innerHeight) / document.documentElement.scrollHeight) * 100);
      if (pct > _maxScroll) _maxScroll = pct;
    }, { passive: true });

    window.addEventListener("pagehide", () => {
      swTrack("page_exit", {
        time_on_page_s: Math.round((Date.now() - _pageStart) / 1000),
        scroll_depth:   _maxScroll,
        sections:       [..._sections].join("|"),
        cta_clicks:     _ctaClicks.length,
      });
      // Trigger sync on exit
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: "SYNC_NOW" });
      }
    });

    // ── Track all link clicks ─────────────────────────────────────────────────
    document.addEventListener("click", e => {
      const a = e.target.closest("a");
      if (!a || !a.href) return;
      const isExternal = !a.href.includes(location.hostname) && a.href.startsWith("http");
      const isCTA = a.classList.contains("btn-primary") || a.classList.contains("nav-cta");
      if (isCTA) _ctaClicks.push(a.href);
      swTrack("link_click", {
        link_href: a.href,
        link_text: (a.innerText||"").trim().slice(0, 80),
        link_type: isExternal ? "external" : "internal",
      });
    });

    // ── Track section visibility ──────────────────────────────────────────────
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const name = e.target.dataset.section || e.target.id || "unknown";
        if (_sections.has(name)) return; // only track first view
        _sections.add(name);
        swTrack("section_view", { section: name });
      });
    }, { threshold: 0.5 });
    document.querySelectorAll("[data-section], section[id]").forEach(el => io.observe(el));

  } catch (e) {
    console.warn("[TekPik SW] Registration failed:", e.message);
  }
}

initSWTracker();
