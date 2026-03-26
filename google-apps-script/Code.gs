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
  USERS:    "USER_PROFILES",
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
  USERS:   ["Visitor ID","Name","Email","Phone","First Seen","Last Seen","Country","City","Device","OS","Browser","Language","Screen","Connection","Battery %","Pages Visited","Total Visits","Avg Time on Page (s)","Max Scroll Depth","CTA Clicks","Traffic Source","Referrer","Cookie Choice","On Waitlist","On Newsletter","Waitlist Date","Newsletter Date"],
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
  buildUserProfiles(ss);
}

// Run manually from dropdown to rebuild charts without resetting layout
function refreshDashboard() {
  rebuildDashboard(SpreadsheetApp.getActiveSpreadsheet());
  SpreadsheetApp.getUi().alert("Dashboard refreshed.");
}

// Updates only the summary stat numbers — no chart changes at all
function refreshStatsOnly() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  writeSummaryStats(ss, ss.getSheetByName(S.DASH));
  SpreadsheetApp.getUi().alert("Stats updated.");
}

function buildUserProfilesMenu() {
  buildUserProfiles(SpreadsheetApp.getActiveSpreadsheet());
  SpreadsheetApp.getUi().alert("USER_PROFILES rebuilt.");
}

// ── USER_PROFILES — one row per unique visitor, all data consolidated ─────────
function buildUserProfiles(ss) {
  ensureSheet(ss, S.USERS, [
    "Visitor ID","Name","Email","Phone",
    "First Seen","Last Seen",
    "Country","City","Device","OS","Browser","Language","Screen","Connection","Battery %",
    "Pages Visited","Total Visits","Avg Time on Page (s)","Max Scroll Depth","CTA Clicks",
    "Traffic Source","Referrer","Cookie Choice",
    "On Waitlist","On Newsletter","Waitlist Date","Newsletter Date"
  ]);

  var sh = ss.getSheetByName(S.USERS);

  // ── Build lookup maps from source sheets ──────────────────────────────────

  // visits → keyed by visitor_id
  var visitMap = {};
  var rawSh = ss.getSheetByName(S.RAW);
  if (rawSh && rawSh.getLastRow() > 1) {
    var rawData = rawSh.getDataRange().getValues();
    var rH = rawData[0];
    var rVid = rH.indexOf("Visitor ID");
    for (var i = 1; i < rawData.length; i++) {
      var r = rawData[i];
      var vid = r[rVid] || "";
      if (!vid) continue;
      if (!visitMap[vid]) {
        visitMap[vid] = {
          first_seen:  r[0], last_seen: r[0],
          country: r[10]||"", city: r[12]||"",
          device:  r[16]||"", os: r[17]||"", browser: r[18]||"",
          language: r[19]||"", screen: r[20]||"", connection: r[23]||"",
          battery: r[24]||"",
          source:  r[5]||"direct", referrer: r[4]||"",
          pages: new Set(), visits: 0,
        };
      }
      var v = visitMap[vid];
      if (r[0] < v.first_seen) v.first_seen = r[0];
      if (r[0] > v.last_seen)  v.last_seen  = r[0];
      v.visits++;
      if (r[1]) v.pages.add(r[1]);
      // Fill in geo/device if missing
      if (!v.country && r[10]) v.country = r[10];
      if (!v.city    && r[12]) v.city    = r[12];
    }
  }

  // sessions → avg time, max scroll, cta clicks per visitor_id
  var sessionMap = {};
  var sesSh = ss.getSheetByName(S.SESSION);
  if (sesSh && sesSh.getLastRow() > 1) {
    var sesData = sesSh.getDataRange().getValues();
    var sH = sesData[0];
    var sVid = sH.indexOf("Visitor ID");
    for (var i = 1; i < sesData.length; i++) {
      var r = sesData[i];
      var vid = r[sVid] || "";
      if (!vid) continue;
      if (!sessionMap[vid]) sessionMap[vid] = { times:[], scrolls:[], cta:0 };
      var s = sessionMap[vid];
      if (r[2] > 0) s.times.push(parseInt(r[2])||0);
      if (r[3] > 0) s.scrolls.push(parseInt(r[3])||0);
      s.cta += parseInt(r[5])||0;
    }
  }

  // waitlist → keyed by visitor_id and email
  var waitMap = {};
  var waitSh = ss.getSheetByName(S.WAITLIST);
  if (waitSh && waitSh.getLastRow() > 1) {
    var wData = waitSh.getDataRange().getValues();
    for (var i = 1; i < wData.length; i++) {
      var r = wData[i];
      // WAITLIST cols: Timestamp,Name,Email,Phone,Page,Referrer,DocID
      waitMap[r[2]] = { name: r[1]||"", email: r[2]||"", phone: r[3]||"", date: r[0]||"" };
    }
  }

  // newsletter → keyed by email
  var newsMap = {};
  var newsSh = ss.getSheetByName(S.NEWS);
  if (newsSh && newsSh.getLastRow() > 1) {
    var nData = newsSh.getDataRange().getValues();
    for (var i = 1; i < nData.length; i++) {
      var r = nData[i];
      newsMap[r[1]] = r[0]; // email → date
    }
  }

  // consent → cookie choice per visitor_id
  var consentMap = {};
  var conSh = ss.getSheetByName(S.CONSENT);
  if (conSh && conSh.getLastRow() > 1) {
    var cData = conSh.getDataRange().getValues();
    var cH = cData[0];
    var cVid = cH.indexOf("Visitor ID");
    var cChoice = cH.indexOf("Choice");
    for (var i = 1; i < cData.length; i++) {
      var r = cData[i];
      var vid = r[cVid]||"";
      if (vid && !consentMap[vid]) consentMap[vid] = r[cChoice]||"";
    }
  }

  // ── Rebuild USER_PROFILES sheet ───────────────────────────────────────────
  // Clear existing data rows
  if (sh.getLastRow() > 1) sh.deleteRows(2, sh.getLastRow()-1);

  var rows = [];
  Object.keys(visitMap).forEach(function(vid) {
    var v  = visitMap[vid];
    var se = sessionMap[vid] || { times:[], scrolls:[], cta:0 };
    var avgTime   = se.times.length   ? Math.round(se.times.reduce(function(a,b){return a+b;},0)/se.times.length) : "";
    var maxScroll = se.scrolls.length ? Math.max.apply(null, se.scrolls) : "";

    // Try to match waitlist by visitor_id (not possible directly) — match by email if available
    // For now mark waitlist/newsletter as unknown unless we can cross-reference
    var wEntry = null;
    var nDate  = "";
    // Check if any waitlist email matches newsletter
    Object.keys(waitMap).forEach(function(email) {
      // We can't directly link visitor_id to email without the user providing it
      // So we leave name/email/phone blank unless filled via form
    });

    rows.push([
      vid,
      "",                          // Name — filled when user submits waitlist
      "",                          // Email
      "",                          // Phone
      v.first_seen,
      v.last_seen,
      v.country, v.city,
      v.device, v.os, v.browser, v.language, v.screen, v.connection, v.battery,
      [...v.pages].join(" | "),
      v.visits,
      avgTime,
      maxScroll,
      se.cta,
      v.source,
      v.referrer,
      consentMap[vid] || "",
      "",                          // On Waitlist
      "",                          // On Newsletter
      "",                          // Waitlist Date
      "",                          // Newsletter Date
    ]);
  });

  // Also add waitlist entries that may not have a visitor_id match
  Object.keys(waitMap).forEach(function(email) {
    var w = waitMap[email];
    var onNews = newsMap[email] ? "yes" : "no";
    // Find if this email matches any existing row — if not, add as new row
    var found = false;
    rows.forEach(function(row) { if (row[2] === email) found = true; });
    if (!found) {
      rows.push([
        "form_" + email.replace(/[^a-z0-9]/gi,"").slice(0,12),
        w.name, w.email, w.phone,
        w.date, w.date,
        "","","","","","","","","",
        "/beta/", 1, "","","",
        "direct","",
        "",
        "yes", onNews, w.date, newsMap[email]||"",
      ]);
    } else {
      // Update existing row with name/email/phone/waitlist info
      rows.forEach(function(row) {
        if (row[2] === email || row[0].indexOf("form_") === 0) return;
        row[1] = w.name;
        row[2] = w.email;
        row[3] = w.phone;
        row[23] = "yes";
        row[25] = w.date;
        row[24] = newsMap[email] ? "yes" : "no";
        row[26] = newsMap[email] || "";
      });
    }
  });

  if (rows.length > 0) {
    sh.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }

  // Style the sheet
  sh.autoResizeColumns(1, sh.getLastColumn());
  Logger.log("USER_PROFILES built: " + rows.length + " users");
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
// rebuildDashboard() only adds MISSING charts (preserves your custom colors).
// forceRebuildDashboard() wipes everything and rebuilds to the default layout.

var CHART_REGISTRY_KEY = "tp_charts_built";

function rebuildDashboard(ss) {
  var dash = ss.getSheetByName(S.DASH);
  var built = {};
  try { built = JSON.parse(PropertiesService.getScriptProperties().getProperty(CHART_REGISTRY_KEY) || "{}"); }
  catch(e) { built = {}; }

  // ── Row 1: Summary stats (rows 1-3) ──────────────────────────────────────
  writeSummaryStats(ss, dash);

  // ── Row 2: Charts row 1 — starts at row 4 ────────────────────────────────
  // Col A(1): Device Types Pie
  // Col C(3): OS Breakdown Pie
  // Col E(5): Traffic Sources Pie
  // Col G(7): Browser Breakdown Pie
  // Col I(9): Scroll Depth Column
  // Col K(11): Top Pages Bar
  if (!built["device_pie"])   { makePie(ss,dash,S.DEVICES,1,4,"Device Types",4,1);        built["device_pie"]=true; }
  if (!built["os_pie"])       { makePie(ss,dash,S.DEVICES,2,4,"OS Breakdown",4,3);        built["os_pie"]=true; }
  if (!built["traffic_pie"])  { makePie(ss,dash,S.SOURCES,1,3,"Traffic Sources",4,5);     built["traffic_pie"]=true; }
  if (!built["browser_pie"])  { makePie(ss,dash,S.DEVICES,3,4,"Browser Breakdown",4,7);   built["browser_pie"]=true; }
  if (!built["scroll_col"])   { makeScrollDepthChart(ss,dash,4,9);                        built["scroll_col"]=true; }
  if (!built["pages_bar"])    { makeBar(ss,dash,S.PAGES,1,3,"Top Pages",4,11);            built["pages_bar"]=true; }

  // ── Row 3: Charts row 2 — starts at row 21 ───────────────────────────────
  // Col A(1): New vs Returning Pie
  // Col C(3): Top Countries Bar
  // Col E(5): Newsletter Signups Area
  // Col G(7): Top Cities Column
  if (!built["newreturn_pie"])    { makeNewReturnPie(ss,dash,21,1);                       built["newreturn_pie"]=true; }
  if (!built["geo_bar"])          { makeBar(ss,dash,S.GEO,1,4,"Top Countries",21,3);      built["geo_bar"]=true; }
  if (!built["newsletter_area"])  { makeAreaChart(ss,dash,S.NEWS,1,"Newsletter Signups Over Time",21,5); built["newsletter_area"]=true; }
  if (!built["cities_col"])       { makeColumn(ss,dash,S.GEO,3,4,"Top Cities",21,7);      built["cities_col"]=true; }

  // ── Row 4: Full-width line charts — starts at row 38 ─────────────────────
  // Col A(1): Daily Visits Line
  // Col G(7): Waitlist Growth Area
  if (!built["visits_line"])      { makeTimeLine(ss,dash,S.RAW,1,"Daily Visits",38,1);    built["visits_line"]=true; }
  if (!built["waitlist_area"])    { makeAreaChart(ss,dash,S.WAITLIST,1,"Waitlist Signups Over Time",38,7); built["waitlist_area"]=true; }

  // ── Row 5: Cookie consent + Sessions line — row 55 ───────────────────────
  if (!built["cookie_pie"])       { makePie(ss,dash,S.COOKIES,1,2,"Cookie Consent",55,1); built["cookie_pie"]=true; }
  if (!built["sessions_line"])    { makeTimeLine(ss,dash,S.SESSION,1,"Daily Sessions",55,7); built["sessions_line"]=true; }

  PropertiesService.getScriptProperties().setProperty(CHART_REGISTRY_KEY, JSON.stringify(built));
  writeSummaryStats(ss, dash);
}

// ── Force full rebuild (clears all charts + registry) ────────────────────────
function forceRebuildDashboard() {
  var ui   = SpreadsheetApp.getUi();
  var conf = ui.alert("This will delete ALL charts and rebuild to the default layout.\nYour custom colors will be reset.\n\nContinue?", ui.ButtonSet.YES_NO);
  if (conf !== ui.Button.YES) return;
  var ss   = SpreadsheetApp.getActiveSpreadsheet();
  var dash = ss.getSheetByName(S.DASH);
  // Remove all charts
  dash.getCharts().forEach(function(c) { dash.removeChart(c); });
  // Clear content but keep the sheet
  dash.clearContents();
  // Clear temp data columns
  dash.getRange(1, 20, dash.getMaxRows(), 22).clearContent();
  // Reset registry so all charts rebuild fresh
  PropertiesService.getScriptProperties().deleteProperty(CHART_REGISTRY_KEY);
  // Rebuild to default layout
  rebuildDashboard(ss);
  ui.alert("Dashboard rebuilt to default layout.");
}

// ── Summary stats block at top of dashboard ───────────────────────────────────
function writeSummaryStats(ss, dash) {
  var rawSh      = ss.getSheetByName(S.RAW);
  var uniqueSh   = ss.getSheetByName(S.UNIQUE);
  var waitSh     = ss.getSheetByName(S.WAITLIST);
  var newsSh     = ss.getSheetByName(S.NEWS);
  var sessionSh  = ss.getSheetByName(S.SESSION);

  // Use UNIQUE_VISITORS count as the true visit count (one per device)
  var uniqueVisitors = uniqueSh ? Math.max(0, uniqueSh.getLastRow() - 1) : 0;
  var totalVisits    = uniqueVisitors; // same — one visit per device
  var waitlistCount  = waitSh  ? Math.max(0, waitSh.getLastRow()  - 1) : 0;
  var newsCount      = newsSh  ? Math.max(0, newsSh.getLastRow()  - 1) : 0;

  var avgTime = 0;
  if (sessionSh && sessionSh.getLastRow() > 1) {
    var times = sessionSh.getRange(2, 3, sessionSh.getLastRow()-1, 1).getValues();
    var sum = 0, count = 0;
    times.forEach(function(r) { if (r[0] > 0) { sum += r[0]; count++; } });
    avgTime = count > 0 ? Math.round(sum / count) : 0;
  }

  var stats = [
    ["👤 Unique Visitors", uniqueVisitors],
    ["📊 Total Page Visits", rawSh ? Math.max(0, rawSh.getLastRow()-1) : 0],
    ["📋 Waitlist Signups",  waitlistCount],
    ["📧 Newsletter Subs",   newsCount],
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
    .addItem("▶ Sync Now (pull from Firestore)",             "syncAll")
    .addItem("👥 Rebuild User Profiles",                     "buildUserProfilesMenu")
    .addItem("🔄 Refresh Stats & Data (keeps layout)",       "refreshStatsOnly")
    .addItem("📊 Add Missing Charts (keeps colors)",         "refreshDashboard")
    .addItem("🔁 Force Full Rebuild (resets layout+colors)", "forceRebuildDashboard")
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
