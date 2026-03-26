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
  upsertCount(ss, S.SOURCES, [fv(f.source)||"direct",  fv(f.medium)||"none"],    2, fv(f.timestamp));
  upsertCount(ss, S.GEO,     [fv(f.country)||"unknown", fv(f.region)||"", fv(f.city)||""], 3, fv(f.timestamp));
  upsertCount(ss, S.DEVICES, [fv(f.device)||"unknown",  fv(f.os)||"unknown", fv(f.browser)||"unknown"], 3, fv(f.timestamp));
  upsertCount(ss, S.PAGES,   [fv(f.page)||"/",          fv(f.page_title)||""], 2, fv(f.timestamp));
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
// IMPORTANT: rebuildDashboard() only adds MISSING charts.
// It never deletes or modifies charts you've already customised.
// To force a full rebuild, run forceRebuildDashboard() instead.

var CHART_REGISTRY_KEY = "tp_charts_built";

function rebuildDashboard(ss) {
  var dash = ss.getSheetByName(S.DASH);

  // Read which charts have already been built
  var built = {};
  try {
    built = JSON.parse(PropertiesService.getScriptProperties().getProperty(CHART_REGISTRY_KEY) || "{}");
  } catch(e) { built = {}; }

  var row = 3;

  // ── ROW 1: Traffic Sources (Pie) + Device Types (Donut) ──────────────────
  row = addChartIfMissing(built, "traffic_pie",   function() {
    return makePie(ss, dash, S.SOURCES, 1, 3, "Traffic Sources",  row, 1);
  }, row, 1);
  row = addChartIfMissing(built, "device_pie",    function() {
    return makePie(ss, dash, S.DEVICES, 1, 4, "Device Types",     row, 7);
  }, row, 7);

  // ── ROW 2: OS Breakdown (Pie) + Browser Breakdown (Pie) ──────────────────
  row += 2;
  row = addChartIfMissing(built, "os_pie",        function() {
    return makePie(ss, dash, S.DEVICES, 2, 4, "OS Breakdown",     row, 1);
  }, row, 1);
  row = addChartIfMissing(built, "browser_pie",   function() {
    return makePie(ss, dash, S.DEVICES, 3, 4, "Browser Breakdown",row, 7);
  }, row, 7);

  // ── ROW 3: Top Countries (Bar) + Top Pages (Bar) ──────────────────────────
  row += 2;
  row = addChartIfMissing(built, "geo_bar",       function() {
    return makeBar(ss, dash, S.GEO,   1, 4, "Top Countries",      row, 1);
  }, row, 1);
  row = addChartIfMissing(built, "pages_bar",     function() {
    return makeBar(ss, dash, S.PAGES, 1, 3, "Top Pages",          row, 7);
  }, row, 7);

  // ── ROW 4: Cookie Consent (Pie) + New vs Returning (Pie) ─────────────────
  row += 2;
  addChartIfMissing(built, "cookie_pie",          function() {
    return makePie(ss, dash, S.COOKIES, 1, 2, "Cookie Consent",   row, 1);
  }, row, 1);
  addChartIfMissing(built, "newreturn_pie",        function() {
    return makeNewReturnPie(ss, dash, row, 7);
  }, row, 7);

  // ── ROW 5: Visits over time (Line) + Sessions over time (Line) ───────────
  row += 18;
  addChartIfMissing(built, "visits_line",         function() {
    return makeTimeLine(ss, dash, S.RAW,     1, "Daily Visits",   row, 1);
  }, row, 1);
  addChartIfMissing(built, "sessions_line",       function() {
    return makeTimeLine(ss, dash, S.SESSION, 1, "Daily Sessions", row, 7);
  }, row, 7);

  // ── ROW 6: Top Cities (Column) + Scroll Depth (Column) ───────────────────
  row += 18;
  addChartIfMissing(built, "cities_col",          function() {
    return makeColumn(ss, dash, S.GEO,     3, 4, "Top Cities",    row, 1);
  }, row, 1);
  addChartIfMissing(built, "scroll_col",          function() {
    return makeScrollDepthChart(ss, dash, row, 7);
  }, row, 7);

  // ── ROW 7: Waitlist growth (Area) + Newsletter growth (Area) ─────────────
  row += 18;
  addChartIfMissing(built, "waitlist_area",       function() {
    return makeAreaChart(ss, dash, S.WAITLIST, 1, "Waitlist Signups Over Time", row, 1);
  }, row, 1);
  addChartIfMissing(built, "newsletter_area",     function() {
    return makeAreaChart(ss, dash, S.NEWS, 1, "Newsletter Signups Over Time",   row, 7);
  }, row, 7);

  // Save registry
  PropertiesService.getScriptProperties().setProperty(CHART_REGISTRY_KEY, JSON.stringify(built));

  // Write summary stats at top
  writeSummaryStats(ss, dash);
}

// Only inserts a chart if it hasn't been built before
function addChartIfMissing(built, key, buildFn, row, col) {
  if (!built[key]) {
    try { buildFn(); built[key] = true; } catch(e) { Logger.log("Chart error " + key + ": " + e.message); }
  }
  return row + 16;
}

// ── Force full rebuild (clears all charts + registry) ────────────────────────
function forceRebuildDashboard() {
  var ui   = SpreadsheetApp.getUi();
  var conf = ui.alert("This will delete ALL charts and rebuild from scratch.\nYour custom colors will be reset.\n\nContinue?", ui.ButtonSet.YES_NO);
  if (conf !== ui.Button.YES) return;
  var ss   = SpreadsheetApp.getActiveSpreadsheet();
  var dash = ss.getSheetByName(S.DASH);
  dash.getCharts().forEach(function(c) { dash.removeChart(c); });
  dash.clearContents();
  PropertiesService.getScriptProperties().deleteProperty(CHART_REGISTRY_KEY);
  rebuildDashboard(ss);
  ui.alert("Dashboard fully rebuilt.");
}

// ── Summary stats block at top of dashboard ───────────────────────────────────
function writeSummaryStats(ss, dash) {
  var rawSh      = ss.getSheetByName(S.RAW);
  var uniqueSh   = ss.getSheetByName(S.UNIQUE);
  var waitSh     = ss.getSheetByName(S.WAITLIST);
  var newsSh     = ss.getSheetByName(S.NEWS);
  var sessionSh  = ss.getSheetByName(S.SESSION);

  var totalVisits    = rawSh    ? Math.max(0, rawSh.getLastRow()    - 1) : 0;
  var uniqueVisitors = uniqueSh ? Math.max(0, uniqueSh.getLastRow() - 1) : 0;
  var waitlistCount  = waitSh   ? Math.max(0, waitSh.getLastRow()   - 1) : 0;
  var newsCount      = newsSh   ? Math.max(0, newsSh.getLastRow()   - 1) : 0;

  // Avg time on page
  var avgTime = 0;
  if (sessionSh && sessionSh.getLastRow() > 1) {
    var times = sessionSh.getRange(2, 3, sessionSh.getLastRow()-1, 1).getValues();
    var sum = 0, count = 0;
    times.forEach(function(r) { if (r[0] > 0) { sum += r[0]; count++; } });
    avgTime = count > 0 ? Math.round(sum / count) : 0;
  }

  // Write stat cards
  var stats = [
    ["📊 Total Visits", totalVisits],
    ["👤 Unique Visitors", uniqueVisitors],
    ["📋 Waitlist Signups", waitlistCount],
    ["📧 Newsletter Subs", newsCount],
    ["⏱ Avg Time on Page (s)", avgTime],
  ];

  dash.getRange("A1").setValue("TekPik Analytics Dashboard — Last updated: " + new Date().toLocaleString())
    .setFontSize(13).setFontWeight("bold").setFontColor("#0C0A09");

  stats.forEach(function(stat, i) {
    var col = (i * 2) + 1;
    dash.getRange(2, col).setValue(stat[0]).setFontWeight("bold").setFontSize(10).setFontColor("#57534E");
    dash.getRange(3, col).setValue(stat[1]).setFontSize(20).setFontWeight("bold").setFontColor("#2563EB");
  });
}

// ── Chart builders ────────────────────────────────────────────────────────────
function makePie(ss, dash, src, lCol, cCol, title, aRow, aCol) {
  var sh = ss.getSheetByName(src);
  if (!sh || sh.getLastRow() < 2) return;
  dash.insertChart(dash.newChart()
    .setChartType(Charts.ChartType.PIE)
    .addRange(sh.getRange(2, lCol, sh.getLastRow()-1, 1))
    .addRange(sh.getRange(2, cCol, sh.getLastRow()-1, 1))
    .setOption("title", title)
    .setOption("pieHole", 0.4)
    .setOption("colors", ["#2563EB","#16A34A","#EA580C","#7C3AED","#0C0A09","#A8A29E","#FBBF24","#06B6D4"])
    .setOption("legend", { position: "right" })
    .setOption("width", 480).setOption("height", 300)
    .setPosition(aRow, aCol, 0, 0).build());
}

function makeBar(ss, dash, src, lCol, cCol, title, aRow, aCol) {
  var sh = ss.getSheetByName(src);
  if (!sh || sh.getLastRow() < 2) return;
  dash.insertChart(dash.newChart()
    .setChartType(Charts.ChartType.BAR)
    .addRange(sh.getRange(2, lCol, sh.getLastRow()-1, 1))
    .addRange(sh.getRange(2, cCol, sh.getLastRow()-1, 1))
    .setOption("title", title)
    .setOption("colors", ["#2563EB"])
    .setOption("legend", { position: "none" })
    .setOption("hAxis", { title: "Visits" })
    .setOption("width", 480).setOption("height", 300)
    .setPosition(aRow, aCol, 0, 0).build());
}

function makeColumn(ss, dash, src, lCol, cCol, title, aRow, aCol) {
  var sh = ss.getSheetByName(src);
  if (!sh || sh.getLastRow() < 2) return;
  dash.insertChart(dash.newChart()
    .setChartType(Charts.ChartType.COLUMN)
    .addRange(sh.getRange(2, lCol, sh.getLastRow()-1, 1))
    .addRange(sh.getRange(2, cCol, sh.getLastRow()-1, 1))
    .setOption("title", title)
    .setOption("colors", ["#7C3AED"])
    .setOption("legend", { position: "none" })
    .setOption("vAxis", { title: "Visits" })
    .setOption("width", 480).setOption("height", 300)
    .setPosition(aRow, aCol, 0, 0).build());
}

// Line chart — visits grouped by date from timestamp column
function makeTimeLine(ss, dash, src, tsCol, title, aRow, aCol) {
  var sh = ss.getSheetByName(src);
  if (!sh || sh.getLastRow() < 2) return;

  var rows  = sh.getRange(2, tsCol, sh.getLastRow()-1, 1).getValues();
  var counts = {};
  rows.forEach(function(r) {
    if (!r[0]) return;
    var d = r[0].toString().slice(0, 10);
    counts[d] = (counts[d] || 0) + 1;
  });

  var keys = Object.keys(counts).sort();
  if (keys.length < 2) return;

  var startCol = aCol === 1 ? 20 : 26;
  var startRow = aRow;
  // Clear old temp data first
  dash.getRange(startRow, startCol, 200, 2).clearContent();
  dash.getRange(startRow, startCol).setValue("Date");
  dash.getRange(startRow, startCol+1).setValue("Count");
  keys.forEach(function(k, i) {
    dash.getRange(startRow+1+i, startCol).setValue(k);
    dash.getRange(startRow+1+i, startCol+1).setValue(counts[k]);
  });

  var dataRange1 = dash.getRange(startRow, startCol, keys.length+1, 1);
  var dataRange2 = dash.getRange(startRow, startCol+1, keys.length+1, 1);

  dash.insertChart(dash.newChart()
    .setChartType(Charts.ChartType.LINE)
    .addRange(dataRange1)
    .addRange(dataRange2)
    .setOption("title", title)
    .setOption("colors", ["#2563EB"])
    .setOption("legend", { position: "none" })
    .setOption("curveType", "function")
    .setOption("pointSize", 4)
    .setOption("vAxis", { title: "Count", minValue: 0 })
    .setOption("hAxis", { slantedText: true, slantedTextAngle: 45 })
    .setOption("width", 480).setOption("height", 300)
    .setPosition(aRow, aCol, 0, 0).build());
}

// Area chart for cumulative signups
function makeAreaChart(ss, dash, src, tsCol, title, aRow, aCol) {
  var sh = ss.getSheetByName(src);
  if (!sh || sh.getLastRow() < 2) return;

  var rows   = sh.getRange(2, tsCol, sh.getLastRow()-1, 1).getValues();
  var counts = {};
  rows.forEach(function(r) {
    if (!r[0]) return;
    var d = r[0].toString().slice(0, 10);
    counts[d] = (counts[d] || 0) + 1;
  });

  var keys = Object.keys(counts).sort();
  if (keys.length < 1) return;

  var startCol = aCol === 1 ? 28 : 31;
  var startRow = aRow;
  // Clear old temp data first
  dash.getRange(startRow, startCol, 200, 2).clearContent();
  dash.getRange(startRow, startCol).setValue("Date");
  dash.getRange(startRow, startCol+1).setValue("Signups");
  var cumulative = 0;
  keys.forEach(function(k, i) {
    cumulative += counts[k];
    dash.getRange(startRow+1+i, startCol).setValue(k);
    dash.getRange(startRow+1+i, startCol+1).setValue(cumulative);
  });

  dash.insertChart(dash.newChart()
    .setChartType(Charts.ChartType.AREA)
    .addRange(dash.getRange(startRow, startCol, keys.length+1, 1))
    .addRange(dash.getRange(startRow, startCol+1, keys.length+1, 1))
    .setOption("title", title)
    .setOption("colors", ["#16A34A"])
    .setOption("legend", { position: "none" })
    .setOption("areaOpacity", 0.2)
    .setOption("curveType", "function")
    .setOption("vAxis", { title: "Total", minValue: 0 })
    .setOption("width", 480).setOption("height", 300)
    .setPosition(aRow, aCol, 0, 0).build());
}

// New vs Returning visitors pie
function makeNewReturnPie(ss, dash, aRow, aCol) {
  var sh = ss.getSheetByName(S.UNIQUE);
  if (!sh || sh.getLastRow() < 2) return;
  var rows = sh.getRange(2, 10, sh.getLastRow()-1, 1).getValues(); // col 10 = Is New
  var newCount = 0, retCount = 0;
  rows.forEach(function(r) {
    if (r[0] === "yes" || r[0] === true) newCount++;
    else retCount++;
  });
  if (newCount + retCount === 0) return;

  var startCol = 34;
  // Clear old temp data first
  dash.getRange(aRow, startCol, 10, 2).clearContent();
  dash.getRange(aRow, startCol).setValue("Type");
  dash.getRange(aRow, startCol+1).setValue("Count");
  dash.getRange(aRow+1, startCol).setValue("New Visitors");
  dash.getRange(aRow+1, startCol+1).setValue(newCount);
  dash.getRange(aRow+2, startCol).setValue("Returning");
  dash.getRange(aRow+2, startCol+1).setValue(retCount);

  dash.insertChart(dash.newChart()
    .setChartType(Charts.ChartType.PIE)
    .addRange(dash.getRange(aRow, startCol, 3, 1))
    .addRange(dash.getRange(aRow, startCol+1, 3, 1))
    .setOption("title", "New vs Returning Visitors")
    .setOption("pieHole", 0.4)
    .setOption("colors", ["#2563EB","#EA580C"])
    .setOption("width", 480).setOption("height", 300)
    .setPosition(aRow, aCol, 0, 0).build());
}

// Scroll depth distribution column chart
function makeScrollDepthChart(ss, dash, aRow, aCol) {
  var sh = ss.getSheetByName(S.SESSION);
  if (!sh || sh.getLastRow() < 2) return;
  var rows = sh.getRange(2, 4, sh.getLastRow()-1, 1).getValues(); // col 4 = scroll depth
  var buckets = { "0-25%":0, "26-50%":0, "51-75%":0, "76-100%":0 };
  rows.forEach(function(r) {
    var v = parseInt(r[0]) || 0;
    if (v <= 25)       buckets["0-25%"]++;
    else if (v <= 50)  buckets["26-50%"]++;
    else if (v <= 75)  buckets["51-75%"]++;
    else               buckets["76-100%"]++;
  });

  var startCol = 36;
  // Clear old temp data first
  dash.getRange(aRow, startCol, 10, 2).clearContent();
  dash.getRange(aRow, startCol).setValue("Depth");
  dash.getRange(aRow, startCol+1).setValue("Sessions");
  var keys = Object.keys(buckets);
  keys.forEach(function(k, i) {
    dash.getRange(aRow+1+i, startCol).setValue(k);
    dash.getRange(aRow+1+i, startCol+1).setValue(buckets[k]);
  });

  dash.insertChart(dash.newChart()
    .setChartType(Charts.ChartType.COLUMN)
    .addRange(dash.getRange(aRow, startCol, 5, 1))
    .addRange(dash.getRange(aRow, startCol+1, 5, 1))
    .setOption("title", "Scroll Depth Distribution")
    .setOption("colors", ["#7C3AED"])
    .setOption("legend", { position: "none" })
    .setOption("vAxis", { title: "Sessions", minValue: 0 })
    .setOption("width", 480).setOption("height", 300)
    .setPosition(aRow, aCol, 0, 0).build());
}

// ── One-time setup ────────────────────────────────────────────────────────────
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureAllSheets(ss);
  installTrigger();
  createMenu();
  SpreadsheetApp.getUi().alert("TekPik: all sheets created and 5-min trigger installed.");
}

// ── Custom menu — appears as "TekPik Admin" in the Sheets toolbar ─────────────
function onOpen() {
  createMenu();
}

function createMenu() {
  SpreadsheetApp.getUi()
    .createMenu("🛠 TekPik Admin")
    .addItem("▶ Sync Now (pull from Firestore)", "syncAll")
    .addItem("📊 Refresh Dashboard Charts",      "refreshDashboard")
    .addItem("🔁 Force Full Rebuild (resets colors)", "forceRebuildDashboard")
    .addSeparator()
    .addSubMenu(SpreadsheetApp.getUi().createMenu("➕ Insert Custom Row")
      .addItem("Insert into RAW_VISITS",    "insertCustomVisit")
      .addItem("Insert into WAITLIST",      "insertCustomWaitlist")
      .addItem("Insert into NEWSLETTER",    "insertCustomNewsletter"))
    .addSeparator()
    .addSubMenu(SpreadsheetApp.getUi().createMenu("🗑 Delete Data")
      .addItem("Delete selected rows (current sheet)", "deleteSelectedRows")
      .addItem("Clear RAW_VISITS data rows",           "clearRawVisits")
      .addItem("Clear WAITLIST data rows",             "clearWaitlist")
      .addItem("Clear NEWSLETTER data rows",           "clearNewsletter")
      .addItem("⚠ Clear ALL sheets data rows",        "clearAllSheets"))
    .addSeparator()
    .addItem("🔄 Reset & Re-sync all Firestore data", "resetAndResync")
    .addToUi();
}

// ── Insert custom rows ────────────────────────────────────────────────────────
function insertCustomVisit() {
  var ui = SpreadsheetApp.getUi();
  var page      = ui.prompt("Insert Visit — Page path (e.g. /beta/)").getResponseText();
  var source    = ui.prompt("Traffic source (e.g. google, direct, instagram)").getResponseText();
  var country   = ui.prompt("Country").getResponseText();
  var device    = ui.prompt("Device (mobile / desktop)").getResponseText();
  if (!page) return;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.getSheetByName(S.RAW).appendRow([
    new Date().toISOString(), page, "", "", "manual_insert",
    source||"direct", "manual", "", "", "",
    country||"", "", "", "", "", "",
    device||"desktop", "", "", "", "", "", "", "",
    "", "", "manual", true, "manual_insert", "MANUAL_" + Date.now()
  ]);
  ui.alert("Row inserted into RAW_VISITS.");
}

function insertCustomWaitlist() {
  var ui    = SpreadsheetApp.getUi();
  var name  = ui.prompt("Full Name").getResponseText();
  var email = ui.prompt("Email").getResponseText();
  var phone = ui.prompt("Phone").getResponseText();
  if (!email) return;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.getSheetByName(S.WAITLIST).appendRow([
    new Date().toISOString(), name||"", email, phone||"",
    "/beta/", "manual_insert", "MANUAL_" + Date.now()
  ]);
  SpreadsheetApp.getUi().alert("Row inserted into WAITLIST.");
}

function insertCustomNewsletter() {
  var ui    = SpreadsheetApp.getUi();
  var email = ui.prompt("Email address").getResponseText();
  if (!email) return;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.getSheetByName(S.NEWS).appendRow([
    new Date().toISOString(), email, "/", "manual_insert", "MANUAL_" + Date.now()
  ]);
  SpreadsheetApp.getUi().alert("Row inserted into NEWSLETTER.");
}

// ── Delete helpers ────────────────────────────────────────────────────────────
function deleteSelectedRows() {
  var sh   = SpreadsheetApp.getActiveSheet();
  var sel  = sh.getActiveRange();
  if (!sel) { SpreadsheetApp.getUi().alert("Select rows first."); return; }
  var ui   = SpreadsheetApp.getUi();
  var conf = ui.alert("Delete " + sel.getNumRows() + " selected row(s)?", ui.ButtonSet.YES_NO);
  if (conf !== ui.Button.YES) return;
  // Delete from bottom to top to avoid index shifting
  var startRow = sel.getRow();
  var numRows  = sel.getNumRows();
  for (var i = startRow + numRows - 1; i >= startRow; i--) {
    if (i > 1) sh.deleteRow(i); // never delete header row 1
  }
}

function clearRawVisits()   { clearSheetData(S.RAW);      }
function clearWaitlist()    { clearSheetData(S.WAITLIST);  }
function clearNewsletter()  { clearSheetData(S.NEWS);      }

function clearAllSheets() {
  var ui   = SpreadsheetApp.getUi();
  var conf = ui.alert(
    "⚠ WARNING",
    "This will delete ALL data rows from every sheet. Headers are kept. This cannot be undone.\n\nContinue?",
    ui.ButtonSet.YES_NO
  );
  if (conf !== ui.Button.YES) return;
  [S.RAW, S.SESSION, S.WAITLIST, S.NEWS, S.CONSENT,
   S.SOURCES, S.GEO, S.DEVICES, S.PAGES, S.COOKIES, S.UNIQUE].forEach(clearSheetData);

  // Also clear temp chart data columns in dashboard (cols 20-40)
  var dash = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(S.DASH);
  if (dash) dash.getRange(1, 20, dash.getMaxRows(), 22).clearContent();

  // Reset chart registry so charts rebuild fresh
  PropertiesService.getScriptProperties().deleteProperty(CHART_REGISTRY_KEY);

  ui.alert("All data cleared. Run refreshDashboard() to rebuild charts with fresh data.");
}

function clearSheetData(name) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sh || sh.getLastRow() < 2) return;
  sh.deleteRows(2, sh.getLastRow() - 1);
}

// Run this ONCE to clear misaligned data rows (keeps headers) then re-sync
function resetAndResync() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetsToClear = [S.RAW, S.SESSION, S.WAITLIST, S.NEWS, S.CONSENT, S.SOURCES, S.GEO, S.DEVICES, S.PAGES, S.COOKIES, S.UNIQUE];
  sheetsToClear.forEach(function(name) {
    var sh = ss.getSheetByName(name);
    if (sh && sh.getLastRow() > 1) {
      sh.deleteRows(2, sh.getLastRow() - 1);
    }
  });
  // Reset _synced flags in Firestore so all docs re-sync
  var collections = ["visits","session_ends","waitlist","newsletter","consent_events"];
  collections.forEach(function(col) {
    resetSyncedFlag(col);
  });
  SpreadsheetApp.getUi().alert("Sheets cleared. Run syncAll() to re-populate with correct column order.");
}

function resetSyncedFlag(col) {
  var token = ScriptApp.getOAuthToken();
  var pageToken = null;
  do {
    var url = FIRESTORE_BASE + "/" + col + "?pageSize=200";
    if (pageToken) url += "&pageToken=" + pageToken;
    var res = UrlFetchApp.fetch(url, { headers: { Authorization: "Bearer " + token }, muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) break;
    var data = JSON.parse(res.getContentText());
    if (!data.documents) break;
    data.documents.forEach(function(doc) {
      var shortPath = doc.name.split("/documents/")[1];
      UrlFetchApp.fetch(FIRESTORE_BASE + "/" + shortPath + "?updateMask.fieldPaths=_synced", {
        method: "PATCH",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        payload: JSON.stringify({ fields: { _synced: { booleanValue: false } } }),
        muteHttpExceptions: true,
      });
    });
    pageToken = data.nextPageToken || null;
  } while (pageToken);
  Logger.log("Reset _synced flags in " + col);
}
