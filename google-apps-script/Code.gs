/**
 * TekPik Analytics — Google Apps Script v2
 * ─────────────────────────────────────────────────────────────────────────────
 * Architecture: Firestore → Apps Script (time-based trigger) → Google Sheets
 *
 * This script runs on a timer (every 5 min), reads unsynced docs from Firestore
 * via the REST API, writes them to Sheets, then marks them _synced: true.
 *
 * Collections read:
 *   visits        → RAW_VISITS sheet + summary tabs
 *   session_ends  → SESSION_ENDS sheet
 *   waitlist      → WAITLIST sheet
 *   newsletter    → NEWSLETTER sheet
 *
 * Tabs:
 *   RAW_VISITS, SESSION_ENDS, WAITLIST, NEWSLETTER,
 *   SOURCES, GEO, DEVICES, PAGES, COOKIES, DASHBOARD
 */

// ── CONFIG — fill these in ────────────────────────────────────────────────────
const PROJECT_ID   = "tekpik-traffc-sheets";
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// ── Sheet names ───────────────────────────────────────────────────────────────
const S = {
  RAW:       "RAW_VISITS",
  SESSION:   "SESSION_ENDS",
  WAITLIST:  "WAITLIST",
  NEWSLETTER:"NEWSLETTER",
  SOURCES:   "SOURCES",
  GEO:       "GEO",
  DEVICES:   "DEVICES",
  PAGES:     "PAGES",
  COOKIES:   "COOKIES",
  DASHBOARD: "DASHBOARD",
};

// ── Column headers ────────────────────────────────────────────────────────────
const COLS = {
  RAW:       ["Timestamp","Page","Title","URL","Referrer","Source","Medium","Campaign","Content","Term","Country","Region","City","Timezone","ISP","IP Hash","Device","OS","Browser","Language","Screen","Viewport","Touch","Connection","Battery %","Charging","Cookie Prefs","Doc ID"],
  SESSION:   ["Timestamp","Page","Time On Page (s)","Scroll Depth %","Sections Viewed","CTA Clicks","CTA Detail","Battery %","Charging","Cookie Prefs","Doc ID"],
  WAITLIST:  ["Timestamp","Name","Email","Phone","Page","Referrer","Doc ID"],
  NEWSLETTER:["Timestamp","Email","Doc ID"],
  SOURCES:   ["Source","Medium","Visits","Last Seen"],
  GEO:       ["Country","Region","City","Visits","Last Seen"],
  DEVICES:   ["Device","OS","Browser","Visits","Last Seen"],
  PAGES:     ["Page","Title","Visits","Last Seen"],
  COOKIES:   ["Choice","Analytics","Personalisation","Marketing","Count","Last Seen"],
};

// ── Entry: manual run or time trigger ────────────────────────────────────────
function syncAll() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureAllSheets(ss);
  syncCollection(ss, "visits",       processVisit);
  syncCollection(ss, "session_ends", processSession);
  syncCollection(ss, "waitlist",     processWaitlist);
  syncCollection(ss, "newsletter",   processNewsletter);
  rebuildDashboard(ss);
}

// ── Install a 5-minute trigger (run once manually) ────────────────────────────
function installTrigger() {
  // Remove existing to avoid duplicates
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === "syncAll") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("syncAll")
    .timeBased().everyMinutes(5).create();
  SpreadsheetApp.getUi().alert("5-minute sync trigger installed.");
}

// ── Firestore REST helpers ────────────────────────────────────────────────────
function firestoreGet(collection, pageToken) {
  const token = ScriptApp.getOAuthToken();
  let url = `${FIRESTORE_BASE}/${collection}?pageSize=200`;
  // Only fetch unsynced docs
  // Firestore REST doesn't support where queries easily, so we filter in-script
  if (pageToken) url += `&pageToken=${pageToken}`;
  const res = UrlFetchApp.fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    muteHttpExceptions: true,
  });
  if (res.getResponseCode() !== 200) {
    Logger.log(`Firestore GET error (${collection}): ${res.getContentText()}`);
    return null;
  }
  return JSON.parse(res.getContentText());
}

function firestorePatch(docPath, fields) {
  const token = ScriptApp.getOAuthToken();
  const url   = `${FIRESTORE_BASE}/${docPath}?updateMask.fieldPaths=_synced`;
  const body  = JSON.stringify({ fields: { _synced: { booleanValue: true } } });
  UrlFetchApp.fetch(url, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    payload: body,
    muteHttpExceptions: true,
  });
}

// Extract a plain value from a Firestore field object
function fv(field) {
  if (!field) return "";
  if (field.stringValue  !== undefined) return field.stringValue;
  if (field.integerValue !== undefined) return parseInt(field.integerValue);
  if (field.doubleValue  !== undefined) return parseFloat(field.doubleValue);
  if (field.booleanValue !== undefined) return field.booleanValue;
  if (field.timestampValue !== undefined) return field.timestampValue;
  return "";
}

// ── Sync a collection ─────────────────────────────────────────────────────────
function syncCollection(ss, colName, processor) {
  let pageToken = null;
  let synced    = 0;

  do {
    const data = firestoreGet(colName, pageToken);
    if (!data || !data.documents) break;

    data.documents.forEach(doc => {
      const f = doc.fields || {};
      // Skip already-synced docs
      if (f._synced && f._synced.booleanValue === true) return;

      try {
        processor(ss, f, doc.name);
        // Mark synced in Firestore
        const shortPath = doc.name.split("/documents/")[1];
        firestorePatch(shortPath, f);
        synced++;
      } catch (e) {
        Logger.log(`Error processing ${doc.name}: ${e.message}`);
      }
    });

    pageToken = data.nextPageToken || null;
  } while (pageToken);

  Logger.log(`Synced ${synced} docs from ${colName}`);
}

// ── Processors ────────────────────────────────────────────────────────────────
function processVisit(ss, f, docName) {
  const docId = docName.split("/").pop();
  const row = [
    fv(f.timestamp), fv(f.page), fv(f.page_title), fv(f.url), fv(f.referrer),
    fv(f.source), fv(f.medium), fv(f.campaign), fv(f.content), fv(f.term),
    fv(f.country), fv(f.region), fv(f.city), fv(f.timezone), fv(f.isp), fv(f.ip_hash),
    fv(f.device), fv(f.os), fv(f.browser), fv(f.language),
    fv(f.screen), fv(f.viewport), fv(f.touch), fv(f.connection),
    fv(f.battery_pct), fv(f.battery_charging), fv(f.cookie_prefs), docId,
  ];
  ss.getSheetByName(S.RAW).appendRow(row);

  // Update summary tabs
  upsertCount(ss, S.SOURCES, [fv(f.source)||"direct", fv(f.medium)||"none"], 2, fv(f.timestamp));
  upsertCount(ss, S.GEO,     [fv(f.country)||"", fv(f.region)||"", fv(f.city)||""], 3, fv(f.timestamp));
  upsertCount(ss, S.DEVICES, [fv(f.device)||"", fv(f.os)||"", fv(f.browser)||""], 3, fv(f.timestamp));
  upsertCount(ss, S.PAGES,   [fv(f.page)||"/", fv(f.page_title)||""], 2, fv(f.timestamp));

  const prefs = fv(f.cookie_prefs);
  if (prefs && prefs !== "not_set") {
    try { upsertCookies(ss, JSON.parse(prefs), fv(f.timestamp)); } catch(_) {}
  }
}

function processSession(ss, f, docName) {
  const docId = docName.split("/").pop();
  ss.getSheetByName(S.SESSION).appendRow([
    fv(f.timestamp), fv(f.page), fv(f.time_on_page_s), fv(f.scroll_depth),
    fv(f.sections_viewed), fv(f.cta_clicks), fv(f.cta_detail),
    fv(f.battery_pct), fv(f.battery_charging), fv(f.cookie_prefs), docId,
  ]);
}

function processWaitlist(ss, f, docName) {
  const docId = docName.split("/").pop();
  ss.getSheetByName(S.WAITLIST).appendRow([
    fv(f.timestamp), fv(f.name), fv(f.email), fv(f.phone),
    fv(f.page), fv(f.referrer), docId,
  ]);
}

function processNewsletter(ss, f, docName) {
  const docId = docName.split("/").pop();
  ss.getSheetByName(S.NEWSLETTER).appendRow([
    fv(f.timestamp), fv(f.email), docId,
  ]);
}

// ── Sheet bootstrap ───────────────────────────────────────────────────────────
function ensureAllSheets(ss) {
  Object.entries(COLS).forEach(([key, headers]) => {
    ensureSheet(ss, S[key], headers);
  });
  ensureSheet(ss, S.DASHBOARD, []);
}

function ensureSheet(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    if (headers.length) {
      const r = sh.getRange(1, 1, 1, headers.length);
      r.setValues([headers]);
      r.setFontWeight("bold").setBackground("#0C0A09").setFontColor("#FFFFFF");
      sh.setFrozenRows(1);
    }
  }
  return sh;
}

// ── Summary upserts ───────────────────────────────────────────────────────────
function upsertCount(ss, sheetName, keyValues, keyCount, timestamp) {
  const sh   = ss.getSheetByName(sheetName);
  const data = sh.getDataRange().getValues();
  const key  = keyValues.join("|").toLowerCase();
  for (let i = 1; i < data.length; i++) {
    if (data[i].slice(0, keyCount).join("|").toLowerCase() === key) {
      sh.getRange(i+1, keyCount+1).setValue(data[i][keyCount]+1);
      sh.getRange(i+1, keyCount+2).setValue(timestamp);
      return;
    }
  }
  sh.appendRow([...keyValues, 1, timestamp]);
}

function upsertCookies(ss, prefs, timestamp) {
  const sh     = ss.getSheetByName(S.COOKIES);
  const data   = sh.getDataRange().getValues();
  const choice = prefs.choice || "custom";
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === choice) {
      sh.getRange(i+1, 5).setValue(data[i][4]+1);
      sh.getRange(i+1, 6).setValue(timestamp);
      return;
    }
  }
  sh.appendRow([choice, prefs.analytics?"yes":"no", prefs.personalisation?"yes":"no", prefs.marketing?"yes":"no", 1, timestamp]);
}

// ── Dashboard charts ──────────────────────────────────────────────────────────
function rebuildDashboard(ss) {
  const dash = ss.getSheetByName(S.DASHBOARD);
  dash.getCharts().forEach(c => dash.removeChart(c));
  dash.clearContents();
  dash.getRange("A1").setValue("TekPik Analytics Dashboard").setFontSize(16).setFontWeight("bold");

  let row = 3;
  row = addPieChart(ss, dash, S.SOURCES,   1, 3, "Traffic Sources",      row, 1);
  row = addPieChart(ss, dash, S.DEVICES,   1, 4, "Device Types",         row, 7);
  row = addBarChart(ss, dash, S.GEO,       1, 4, "Top Countries",        row+2, 1);
  row = addBarChart(ss, dash, S.PAGES,     1, 3, "Top Pages",            row+2, 7);
       addPieChart(ss, dash, S.COOKIES,   1, 5, "Cookie Consent",       row+2, 1);
}

function addPieChart(ss, dash, src, lCol, cCol, title, aRow, aCol) {
  const sh = ss.getSheetByName(src);
  if (sh.getLastRow() < 2) return aRow+16;
  const chart = dash.newChart()
    .setChartType(Charts.ChartType.PIE)
    .addRange(sh.getRange(2, lCol, sh.getLastRow()-1, 1))
    .addRange(sh.getRange(2, cCol, sh.getLastRow()-1, 1))
    .setOption("title", title)
    .setOption("pieHole", 0.4)
    .setOption("colors", ["#2563EB","#16A34A","#EA580C","#7C3AED","#0C0A09","#A8A29E"])
    .setOption("width", 480).setOption("height", 300)
    .setPosition(aRow, aCol, 0, 0).build();
  dash.insertChart(chart);
  return aRow+16;
}

function addBarChart(ss, dash, src, lCol, cCol, title, aRow, aCol) {
  const sh = ss.getSheetByName(src);
  if (sh.getLastRow() < 2) return aRow+16;
  const chart = dash.newChart()
    .setChartType(Charts.ChartType.BAR)
    .addRange(sh.getRange(2, lCol, sh.getLastRow()-1, 1))
    .addRange(sh.getRange(2, cCol, sh.getLastRow()-1, 1))
    .setOption("title", title)
    .setOption("colors", ["#2563EB"])
    .setOption("legend", { position:"none" })
    .setOption("width", 480).setOption("height", 300)
    .setPosition(aRow, aCol, 0, 0).build();
  dash.insertChart(chart);
  return aRow+16;
}

// ── Manual setup ──────────────────────────────────────────────────────────────
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureAllSheets(ss);
  installTrigger();
  SpreadsheetApp.getUi().alert("TekPik sheets created and 5-min sync trigger installed.");
}
