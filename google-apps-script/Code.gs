/**
 * TekPik Analytics — Google Apps Script v3
 * Firestore → Apps Script (5-min timer) → Google Sheets
 *
 * SETUP: Run setup() once to create all sheets and install the trigger.
 * DASHBOARD: Run refreshDashboard() manually to rebuild charts.
 */

const PROJECT_ID     = "tekpik-traffc-sheets";
const FIRESTORE_BASE = "https://firestore.googleapis.com/v1/projects/" + PROJECT_ID + "/databases/(default)/documents";

const S = {
  RAW:      "RAW_VISITS",
  SESSION:  "SESSION_ENDS",
  WAITLIST: "WAITLIST",
  NEWS:     "NEWSLETTER",
  CONSENT:  "CONSENT_EVENTS",
  SOURCES:  "SOURCES",
  GEO:      "GEO",
  DEVICES:  "DEVICES",
  PAGES:    "PAGES",
  COOKIES:  "COOKIES",
  UNIQUE:   "UNIQUE_VISITORS",
  DASH:     "DASHBOARD",
};

const COLS = {
  RAW:     ["Timestamp","Page","Title","URL","Referrer","Source","Medium","Campaign","Content","Term","Country","Region","City","Timezone","ISP","IP Hash","Device","OS","Browser","Language","Screen","Viewport","Touch","Connection","Battery %","Charging","Visitor ID","New Visitor","Cookie Prefs","Doc ID"],
  SESSION: ["Timestamp","Page","Time On Page (s)","Scroll Depth %","Sections Viewed","CTA Clicks","CTA Detail","Battery %","Charging","Visitor ID","Doc ID"],
  WAITLIST:["Timestamp","Name","Email","Phone","Page","Referrer","Doc ID"],
  NEWS:    ["Timestamp","Email","Page","Referrer","Doc ID"],
  CONSENT: ["Timestamp","Visitor ID","Event","Choice","Analytics","Personalisation","Marketing","Time To Decide (s)","Device","Page","Doc ID"],
  SOURCES: ["Source","Medium","Visits","Last Seen"],
  GEO:     ["Country","Region","City","Visits","Last Seen"],
  DEVICES: ["Device","OS","Browser","Visits","Last Seen"],
  PAGES:   ["Page","Title","Visits","Last Seen"],
  COOKIES: ["Choice","Count","Last Seen"],
  UNIQUE:  ["Visitor ID","First Seen","Last Seen","Total Visits","Device","OS","Browser","Country","City","Is New"],
};

// ── Main sync — runs every 5 min via trigger ──────────────────────────────────
function syncAll() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureAllSheets(ss);
  syncCollection(ss, "visits",         processVisit);
  syncCollection(ss, "session_ends",   processSession);
  syncCollection(ss, "waitlist",       processWaitlist);
  syncCollection(ss, "newsletter",     processNewsletter);
  syncCollection(ss, "consent_events", processConsent);
}

// Run manually from dropdown to rebuild charts without resetting layout
function refreshDashboard() {
  rebuildDashboard(SpreadsheetApp.getActiveSpreadsheet());
  SpreadsheetApp.getUi().alert("Dashboard refreshed.");
}

// ── Trigger install ───────────────────────────────────────────────────────────
function installTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("syncAll").timeBased().everyMinutes(5).create();
  SpreadsheetApp.getUi().alert("5-minute sync trigger installed.");
}

// ── Firestore REST ────────────────────────────────────────────────────────────
function firestoreGet(col, pageToken) {
  const token = ScriptApp.getOAuthToken();
  let url = FIRESTORE_BASE + "/" + col + "?pageSize=200";
  if (pageToken) url += "&pageToken=" + pageToken;
  const res = UrlFetchApp.fetch(url, {
    headers: { Authorization: "Bearer " + token },
    muteHttpExceptions: true,
  });
  if (res.getResponseCode() !== 200) {
    Logger.log("GET error (" + col + "): " + res.getContentText());
    return null;
  }
  return JSON.parse(res.getContentText());
}

function firestorePatch(docPath) {
  const token = ScriptApp.getOAuthToken();
  UrlFetchApp.fetch(FIRESTORE_BASE + "/" + docPath + "?updateMask.fieldPaths=_synced", {
    method: "PATCH",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    payload: JSON.stringify({ fields: { _synced: { booleanValue: true } } }),
    muteHttpExceptions: true,
  });
}

function fv(f) {
  if (!f) return "";
  if (f.stringValue   !== undefined) return f.stringValue;
  if (f.integerValue  !== undefined) return parseInt(f.integerValue);
  if (f.doubleValue   !== undefined) return parseFloat(f.doubleValue);
  if (f.booleanValue  !== undefined) return f.booleanValue;
  if (f.timestampValue !== undefined) return f.timestampValue;
  return "";
}

// ── Collection sync ───────────────────────────────────────────────────────────
function syncCollection(ss, colName, processor) {
  let pageToken = null, synced = 0;
  do {
    const data = firestoreGet(colName, pageToken);
    if (!data || !data.documents) break;
    data.documents.forEach(function(doc) {
      const f = doc.fields || {};
      if (f._synced && f._synced.booleanValue === true) return;
      try {
        processor(ss, f, doc.name);
        firestorePatch(doc.name.split("/documents/")[1]);
        synced++;
      } catch(e) {
        Logger.log("Error " + doc.name + ": " + e.message);
      }
    });
    pageToken = data.nextPageToken || null;
  } while (pageToken);
  Logger.log("Synced " + synced + " from " + colName);
}

// ── Processors ────────────────────────────────────────────────────────────────
function processVisit(ss, f, docName) {
  const id = docName.split("/").pop();
  ss.getSheetByName(S.RAW).appendRow([
    fv(f.timestamp), fv(f.page), fv(f.page_title), fv(f.url), fv(f.referrer),
    fv(f.source), fv(f.medium), fv(f.campaign), fv(f.content), fv(f.term),
    fv(f.country), fv(f.region), fv(f.city), fv(f.timezone), fv(f.isp), fv(f.ip_hash),
    fv(f.device), fv(f.os), fv(f.browser), fv(f.language),
    fv(f.screen), fv(f.viewport), fv(f.touch), fv(f.connection),
    fv(f.battery_pct), fv(f.battery_charging),
    fv(f.visitor_id), fv(f.is_new_visitor), fv(f.cookie_prefs), id,
  ]);
  upsertCount(ss, S.SOURCES, [fv(f.source)||"direct", fv(f.medium)||"none"], 2, fv(f.timestamp));
  upsertCount(ss, S.GEO,     [fv(f.country)||"", fv(f.region)||"", fv(f.city)||""], 3, fv(f.timestamp));
  upsertCount(ss, S.DEVICES, [fv(f.device)||"", fv(f.os)||"", fv(f.browser)||""], 3, fv(f.timestamp));
  upsertCount(ss, S.PAGES,   [fv(f.page)||"/", fv(f.page_title)||""], 2, fv(f.timestamp));
  var vid = fv(f.visitor_id);
  if (vid) upsertUniqueVisitor(ss, f, vid);
}

function processSession(ss, f, docName) {
  ss.getSheetByName(S.SESSION).appendRow([
    fv(f.timestamp), fv(f.page), fv(f.time_on_page_s), fv(f.scroll_depth),
    fv(f.sections_viewed), fv(f.cta_clicks), fv(f.cta_detail),
    fv(f.battery_pct), fv(f.battery_charging), fv(f.visitor_id),
    docName.split("/").pop(),
  ]);
}

function processWaitlist(ss, f, docName) {
  ss.getSheetByName(S.WAITLIST).appendRow([
    fv(f.timestamp), fv(f.name), fv(f.email), fv(f.phone),
    fv(f.page), fv(f.referrer), docName.split("/").pop(),
  ]);
}

function processNewsletter(ss, f, docName) {
  ss.getSheetByName(S.NEWS).appendRow([
    fv(f.timestamp), fv(f.email), fv(f.page), fv(f.referrer),
    docName.split("/").pop(),
  ]);
}

function processConsent(ss, f, docName) {
  var choice = fv(f.choice) || "unknown";
  ss.getSheetByName(S.CONSENT).appendRow([
    fv(f.timestamp), fv(f.visitor_id), fv(f.event), choice,
    fv(f.analytics), fv(f.personalisation), fv(f.marketing),
    fv(f.time_to_decide_s), fv(f.device), fv(f.page),
    docName.split("/").pop(),
  ]);
  // Also update cookie summary
  var sh   = ss.getSheetByName(S.COOKIES);
  var data = sh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === choice) {
      sh.getRange(i+1, 2).setValue(data[i][1] + 1);
      sh.getRange(i+1, 3).setValue(fv(f.timestamp));
      return;
    }
  }
  sh.appendRow([choice, 1, fv(f.timestamp)]);
}

// ── Upserts ───────────────────────────────────────────────────────────────────
function upsertCount(ss, sheetName, keyValues, keyCount, timestamp) {
  var sh   = ss.getSheetByName(sheetName);
  var data = sh.getDataRange().getValues();
  var key  = keyValues.join("|").toLowerCase();
  for (var i = 1; i < data.length; i++) {
    if (data[i].slice(0, keyCount).join("|").toLowerCase() === key) {
      sh.getRange(i+1, keyCount+1).setValue(data[i][keyCount] + 1);
      sh.getRange(i+1, keyCount+2).setValue(timestamp);
      return;
    }
  }
  sh.appendRow(keyValues.concat([1, timestamp]));
}

function upsertUniqueVisitor(ss, f, vid) {
  var sh   = ss.getSheetByName(S.UNIQUE);
  var data = sh.getDataRange().getValues();
  var ts   = fv(f.timestamp);
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === vid) {
      sh.getRange(i+1, 3).setValue(ts);
      sh.getRange(i+1, 4).setValue(data[i][3] + 1);
      return;
    }
  }
  sh.appendRow([
    vid, ts, ts, 1,
    fv(f.device)||"", fv(f.os)||"", fv(f.browser)||"",
    fv(f.country)||"", fv(f.city)||"",
    fv(f.is_new_visitor) === true ? "yes" : "no",
  ]);
}

// ── Sheet bootstrap ───────────────────────────────────────────────────────────
function ensureAllSheets(ss) {
  Object.keys(COLS).forEach(function(key) {
    ensureSheet(ss, S[key], COLS[key]);
  });
  ensureSheet(ss, S.DASH, []);
}

function ensureSheet(ss, name, headers) {
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    if (headers.length) {
      var r = sh.getRange(1, 1, 1, headers.length);
      r.setValues([headers]);
      r.setFontWeight("bold").setBackground("#0C0A09").setFontColor("#FFFFFF");
      sh.setFrozenRows(1);
    }
  }
  return sh;
}

// ── Dashboard charts ──────────────────────────────────────────────────────────
function rebuildDashboard(ss) {
  var dash = ss.getSheetByName(S.DASH);
  dash.getCharts().forEach(function(c) { dash.removeChart(c); });
  dash.clearContents();
  dash.getRange("A1").setValue("TekPik Analytics Dashboard").setFontSize(16).setFontWeight("bold");
  var row = 3;
  row = addPieChart(ss, dash, S.SOURCES, 1, 3, "Traffic Sources",   row, 1);
  row = addPieChart(ss, dash, S.DEVICES, 1, 4, "Device Types",      row, 7);
  row = addBarChart(ss, dash, S.GEO,     1, 4, "Top Countries",     row+2, 1);
  row = addBarChart(ss, dash, S.PAGES,   1, 3, "Top Pages",         row+2, 7);
       addPieChart(ss, dash, S.COOKIES,  1, 2, "Cookie Consent",   row+2, 1);
}

function addPieChart(ss, dash, src, lCol, cCol, title, aRow, aCol) {
  var sh = ss.getSheetByName(src);
  if (!sh || sh.getLastRow() < 2) return aRow + 16;
  dash.insertChart(dash.newChart()
    .setChartType(Charts.ChartType.PIE)
    .addRange(sh.getRange(2, lCol, sh.getLastRow()-1, 1))
    .addRange(sh.getRange(2, cCol, sh.getLastRow()-1, 1))
    .setOption("title", title).setOption("pieHole", 0.4)
    .setOption("colors", ["#2563EB","#16A34A","#EA580C","#7C3AED","#0C0A09","#A8A29E"])
    .setOption("width", 480).setOption("height", 300)
    .setPosition(aRow, aCol, 0, 0).build());
  return aRow + 16;
}

function addBarChart(ss, dash, src, lCol, cCol, title, aRow, aCol) {
  var sh = ss.getSheetByName(src);
  if (!sh || sh.getLastRow() < 2) return aRow + 16;
  dash.insertChart(dash.newChart()
    .setChartType(Charts.ChartType.BAR)
    .addRange(sh.getRange(2, lCol, sh.getLastRow()-1, 1))
    .addRange(sh.getRange(2, cCol, sh.getLastRow()-1, 1))
    .setOption("title", title).setOption("colors", ["#2563EB"])
    .setOption("legend", { position: "none" })
    .setOption("width", 480).setOption("height", 300)
    .setPosition(aRow, aCol, 0, 0).build());
  return aRow + 16;
}

// ── One-time setup ────────────────────────────────────────────────────────────
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureAllSheets(ss);
  installTrigger();
  SpreadsheetApp.getUi().alert("TekPik: all sheets created and 5-min trigger installed.");
}
