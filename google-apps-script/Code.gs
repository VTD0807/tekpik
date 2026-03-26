/**
 * TekPik Analytics — Google Apps Script v4
 * Firestore → Apps Script (5-min timer) → Google Sheets
 * SETUP: Run setup() once. DASHBOARD: Run refreshDashboard() manually.
 */

const PROJECT_ID     = "tekpik-traffc-sheets";
const FIRESTORE_BASE = "https://firestore.googleapis.com/v1/projects/" + PROJECT_ID + "/databases/(default)/documents";

// ── Sheet name constants ──────────────────────────────────────────────────────
const S = {
  RAW:       "RAW_VISITS",
  SESSION:   "SESSION_ENDS",
  WAITLIST:  "WAITLIST",
  NEWS:      "NEWSLETTER",
  CONSENT:   "CONSENT_EVENTS",
  SOURCES:   "SOURCES",
  GEO:       "GEO",
  DEVICES:   "DEVICES",
  PAGES:     "PAGES",
  COOKIES:   "COOKIES",
  UNIQUE:    "UNIQUE_VISITORS",
  USERS:     "USER_PROFILES",
  CAMPAIGNS: "CAMPAIGNS",
  DASH:      "DASHBOARD",
};

// ── Column headers ────────────────────────────────────────────────────────────
const COLS = {
  RAW:       ["Timestamp","Page","Title","URL","Referrer","Source","Medium","Campaign","Content","Term",
               "Country","Region","City","Timezone","ISP","IP Hash",
               "Device","Brand","Model","OS","OS Version","Browser","Browser Version",
               "Language","Screen","Viewport","Pixel Ratio","Touch","Touch Points",
               "Connection","Connection Type","Downlink","Memory GB","CPU Cores","Platform",
               "Battery %","Charging","Visitor ID","New Visitor","Cookie Prefs","Doc ID"],
  SESSION:   ["Timestamp","Page","Time On Page (s)","Scroll Depth %","Sections Viewed","CTA Clicks","CTA Detail","Battery %","Charging","Visitor ID","Doc ID"],
  WAITLIST:  ["Timestamp","Name","Email","Phone","Page","Referrer","Doc ID"],
  NEWS:      ["Timestamp","Email","Page","Referrer","Doc ID"],
  CONSENT:   ["Timestamp","Visitor ID","Event","Choice","Analytics","Personalisation","Marketing","Time To Decide (s)","Device","Page","Doc ID"],
  SOURCES:   ["Source","Medium","Visits","Last Seen"],
  GEO:       ["Country","Region","City","Visits","Last Seen"],
  DEVICES:   ["Device","Brand","OS","Browser","Visits","Last Seen"],
  PAGES:     ["Page","Title","Visits","Last Seen"],
  COOKIES:   ["Choice","Count","Last Seen"],
  UNIQUE:    ["Visitor ID","First Seen","Last Seen","Total Visits","Device","Brand","Model","OS","OS Version","Browser","Country","City","Memory GB","CPU Cores","Is New"],
  USERS:     ["Visitor ID","Name","Email","Phone","First Seen","Last Seen","Country","City","Device","Brand","Model","OS","OS Version","Browser","Language","Screen","Connection","Memory GB","CPU Cores","Pages Visited","Total Visits","Avg Time (s)","Max Scroll %","CTA Clicks","Source","Referrer","Cookie Choice","On Waitlist","On Newsletter","Waitlist Date","Newsletter Date"],
  CAMPAIGNS: ["Campaign","Source","Medium","Content","Visits","Unique Visitors","Last Click","Pages Hit"],
};

// ── Main sync ─────────────────────────────────────────────────────────────────
function syncAll() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureAllSheets(ss);
  syncCollection(ss, "visits",         processVisit);
  syncCollection(ss, "session_ends",   processSession);
  syncCollection(ss, "waitlist",       processWaitlist);
  syncCollection(ss, "newsletter",     processNewsletter);
  syncCollection(ss, "consent_events", processConsent);
  // USER_PROFILES & CAMPAIGNS built manually to avoid quota
}

function refreshDashboard() {
  rebuildDashboard(SpreadsheetApp.getActiveSpreadsheet());
  SpreadsheetApp.getUi().alert("Dashboard refreshed.");
}

function refreshStatsOnly() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  writeSummaryStats(ss, ss.getSheetByName(S.DASH));
  SpreadsheetApp.getUi().alert("Stats updated.");
}

function buildUserProfilesMenu() {
  try {
    buildUserProfiles(SpreadsheetApp.getActiveSpreadsheet());
    SpreadsheetApp.getUi().alert("USER_PROFILES & CAMPAIGNS rebuilt.");
  } catch(e) {
    SpreadsheetApp.getUi().alert("Error: " + e.message);
  }
}

// ── Trigger ───────────────────────────────────────────────────────────────────
function installTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger("syncAll").timeBased().everyMinutes(5).create();
  SpreadsheetApp.getUi().alert("5-minute sync trigger installed.");
}

// ── Firestore REST ────────────────────────────────────────────────────────────
function firestoreGet(col, pageToken) {
  var token = ScriptApp.getOAuthToken();
  var url   = FIRESTORE_BASE + "/" + col + "?pageSize=50";
  if (pageToken) url += "&pageToken=" + pageToken;
  var res = UrlFetchApp.fetch(url, { headers: { Authorization: "Bearer " + token }, muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) { Logger.log("GET error (" + col + "): " + res.getContentText()); return null; }
  return JSON.parse(res.getContentText());
}

function firestorePatch(docPath) {
  var token = ScriptApp.getOAuthToken();
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

function syncCollection(ss, colName, processor) {
  var pageToken = null, synced = 0;
  do {
    var data = firestoreGet(colName, pageToken);
    if (!data || !data.documents) break;
    data.documents.forEach(function(doc) {
      var f = doc.fields || {};
      if (f._synced && f._synced.booleanValue === true) return;
      try {
        processor(ss, f, doc.name);
        firestorePatch(doc.name.split("/documents/")[1]);
        synced++;
      } catch(e) { Logger.log("Error " + doc.name + ": " + e.message); }
    });
    pageToken = data.nextPageToken || null;
  } while (pageToken);
  Logger.log("Synced " + synced + " from " + colName);
}

// ── Processors ────────────────────────────────────────────────────────────────
function processVisit(ss, f, docName) {
  var id = docName.split("/").pop();
  ss.getSheetByName(S.RAW).appendRow([
    fv(f.timestamp), fv(f.page), fv(f.page_title), fv(f.url), fv(f.referrer),
    fv(f.source), fv(f.medium), fv(f.campaign), fv(f.content), fv(f.term),
    fv(f.country), fv(f.region), fv(f.city), fv(f.timezone), fv(f.isp), fv(f.ip_hash),
    fv(f.device), fv(f.brand)||"", fv(f.model)||"",
    fv(f.os), fv(f.os_version)||"", fv(f.browser), fv(f.browser_version)||"",
    fv(f.language), fv(f.screen), fv(f.viewport),
    fv(f.pixel_ratio)||"", fv(f.touch), fv(f.touch_points)||"",
    fv(f.connection), fv(f.connection_type)||"", fv(f.downlink)||"",
    fv(f.memory_gb)||"", fv(f.cpu_cores)||"", fv(f.platform)||"",
    fv(f.battery_pct), fv(f.battery_charging),
    fv(f.visitor_id), fv(f.is_new_visitor), fv(f.cookie_prefs), id,
  ]);
  upsertCount(ss, S.SOURCES, [fv(f.source)||"direct", fv(f.medium)||"none"], 2, fv(f.timestamp));
  upsertCount(ss, S.GEO,     [fv(f.country)||"unknown", fv(f.region)||"", fv(f.city)||""], 3, fv(f.timestamp));
  upsertCount(ss, S.DEVICES, [fv(f.device)||"unknown", fv(f.brand)||"unknown", fv(f.os)||"unknown", fv(f.browser)||"unknown"], 4, fv(f.timestamp));
  upsertCount(ss, S.PAGES,   [fv(f.page)||"/", fv(f.page_title)||""], 2, fv(f.timestamp));
  var vid = fv(f.visitor_id);
  if (vid) upsertUniqueVisitor(ss, f, vid);
  // Campaign tracking
  var campaign = fv(f.campaign);
  if (campaign) upsertCampaign(ss, f, campaign);
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
  var sh = ss.getSheetByName(S.COOKIES);
  var data = sh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === choice) { sh.getRange(i+1,2).setValue(data[i][1]+1); sh.getRange(i+1,3).setValue(fv(f.timestamp)); return; }
  }
  sh.appendRow([choice, 1, fv(f.timestamp)]);
}

// ── Upserts ───────────────────────────────────────────────────────────────────
function upsertCount(ss, sheetName, keyValues, keyCount, timestamp) {
  var sh = ss.getSheetByName(sheetName);
  var data = sh.getDataRange().getValues();
  var key = keyValues.join("|").toLowerCase();
  for (var i = 1; i < data.length; i++) {
    if (data[i].slice(0,keyCount).join("|").toLowerCase() === key) {
      sh.getRange(i+1,keyCount+1).setValue(data[i][keyCount]+1);
      sh.getRange(i+1,keyCount+2).setValue(timestamp);
      return;
    }
  }
  sh.appendRow(keyValues.concat([1, timestamp]));
}

function upsertUniqueVisitor(ss, f, vid) {
  var sh = ss.getSheetByName(S.UNIQUE);
  var data = sh.getDataRange().getValues();
  var ts = fv(f.timestamp);
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === vid) {
      sh.getRange(i+1,3).setValue(ts);
      sh.getRange(i+1,4).setValue(data[i][3]+1);
      return;
    }
  }
  sh.appendRow([
    vid, ts, ts, 1,
    fv(f.device)||"", fv(f.brand)||"", fv(f.model)||"",
    fv(f.os)||"", fv(f.os_version)||"", fv(f.browser)||"",
    fv(f.country)||"", fv(f.city)||"",
    fv(f.memory_gb)||"", fv(f.cpu_cores)||"",
    fv(f.is_new_visitor)===true ? "yes" : "no",
  ]);
}

function upsertCampaign(ss, f, campaign) {
  var sh = ss.getSheetByName(S.CAMPAIGNS);
  var data = sh.getDataRange().getValues();
  var source = fv(f.source)||""; var medium = fv(f.medium)||"";
  var content = fv(f.content)||""; var page = fv(f.page)||"";
  var key = (campaign+"|"+source+"|"+medium).toLowerCase();
  for (var i = 1; i < data.length; i++) {
    if ((data[i][0]+"|"+data[i][1]+"|"+data[i][2]).toLowerCase() === key) {
      sh.getRange(i+1,5).setValue(data[i][4]+1);
      var vid = fv(f.visitor_id);
      var uv = data[i][5]||0;
      // Simple unique visitor count per campaign (approximate)
      sh.getRange(i+1,6).setValue(uv+1);
      sh.getRange(i+1,7).setValue(fv(f.timestamp));
      var pages = data[i][7]||"";
      if (page && pages.indexOf(page) === -1) sh.getRange(i+1,8).setValue(pages ? pages+"|"+page : page);
      return;
    }
  }
  sh.appendRow([campaign, source, medium, content, 1, 1, fv(f.timestamp), page]);
}

// ── USER_PROFILES — one row per unique visitor ────────────────────────────────
function buildUserProfiles(ss) {
  ensureSheet(ss, S.USERS, COLS.USERS);
  ensureSheet(ss, S.CAMPAIGNS, COLS.CAMPAIGNS);
  var sh = ss.getSheetByName(S.USERS);
  if (sh.getLastRow() > 1) sh.deleteRows(2, sh.getLastRow()-1);

  var visitMap = {}, sessionMap = {}, waitMap = {}, newsMap = {}, consentMap = {};

  // RAW_VISITS
  var rawSh = ss.getSheetByName(S.RAW);
  if (rawSh && rawSh.getLastRow() > 1) {
    var rData = rawSh.getDataRange().getValues();
    var rH = rData[0];
    var rVid = rH.indexOf("Visitor ID");
    for (var i = 1; i < rData.length; i++) {
      var r = rData[i]; var vid = r[rVid]||""; if (!vid) continue;
      if (!visitMap[vid]) visitMap[vid] = {
        first:r[0],last:r[0],country:r[10]||"",city:r[12]||"",
        device:r[16]||"",brand:r[17]||"",model:r[18]||"",
        os:r[19]||"",os_v:r[20]||"",browser:r[21]||"",
        lang:r[23]||"",screen:r[24]||"",conn:r[29]||"",
        mem:r[32]||"",cpu:r[33]||"",
        source:r[5]||"direct",referrer:r[4]||"",
        pages:new Set(),visits:0
      };
      var v = visitMap[vid];
      if (r[0] < v.first) v.first = r[0];
      if (r[0] > v.last)  v.last  = r[0];
      v.visits++; if (r[1]) v.pages.add(r[1]);
    }
  }

  // SESSION_ENDS
  var sesSh = ss.getSheetByName(S.SESSION);
  if (sesSh && sesSh.getLastRow() > 1) {
    var sData = sesSh.getDataRange().getValues();
    var sH = sData[0]; var sVid = sH.indexOf("Visitor ID");
    for (var i = 1; i < sData.length; i++) {
      var r = sData[i]; var vid = r[sVid]||""; if (!vid) continue;
      if (!sessionMap[vid]) sessionMap[vid] = {times:[],scrolls:[],cta:0};
      var s = sessionMap[vid];
      if (r[2]>0) s.times.push(parseInt(r[2])||0);
      if (r[3]>0) s.scrolls.push(parseInt(r[3])||0);
      s.cta += parseInt(r[5])||0;
    }
  }

  // WAITLIST
  var wSh = ss.getSheetByName(S.WAITLIST);
  if (wSh && wSh.getLastRow() > 1) {
    var wData = wSh.getDataRange().getValues();
    for (var i = 1; i < wData.length; i++) {
      var r = wData[i];
      waitMap[r[2]] = {name:r[1]||"",email:r[2]||"",phone:r[3]||"",date:r[0]||""};
    }
  }

  // NEWSLETTER
  var nSh = ss.getSheetByName(S.NEWS);
  if (nSh && nSh.getLastRow() > 1) {
    var nData = nSh.getDataRange().getValues();
    for (var i = 1; i < nData.length; i++) { newsMap[nData[i][1]] = nData[i][0]; }
  }

  // CONSENT
  var cSh = ss.getSheetByName(S.CONSENT);
  if (cSh && cSh.getLastRow() > 1) {
    var cData = cSh.getDataRange().getValues();
    var cH = cData[0]; var cVid = cH.indexOf("Visitor ID"); var cChoice = cH.indexOf("Choice");
    for (var i = 1; i < cData.length; i++) {
      var vid = cData[i][cVid]||"";
      if (vid && !consentMap[vid]) consentMap[vid] = cData[i][cChoice]||"";
    }
  }

  // Build rows
  var rows = [];
  Object.keys(visitMap).forEach(function(vid) {
    var v = visitMap[vid];
    var se = sessionMap[vid]||{times:[],scrolls:[],cta:0};
    var avgT = se.times.length ? Math.round(se.times.reduce(function(a,b){return a+b;},0)/se.times.length) : "";
    var maxS = se.scrolls.length ? Math.max.apply(null,se.scrolls) : "";
    rows.push([
      vid,"","","",
      v.first,v.last,
      v.country,v.city,v.device,v.brand,v.model,v.os,v.os_v,v.browser,
      v.lang,v.screen,v.conn,v.mem,v.cpu,
      [...v.pages].join(" | "),v.visits,avgT,maxS,se.cta,
      v.source,v.referrer,consentMap[vid]||"",
      "","","",""
    ]);
  });

  // Add waitlist entries
  Object.keys(waitMap).forEach(function(email) {
    var w = waitMap[email]; var onNews = newsMap[email] ? "yes" : "no";
    var found = false;
    rows.forEach(function(row) { if (row[2]===email) { row[1]=w.name;row[2]=w.email;row[3]=w.phone;row[26]="yes";row[28]=w.date;row[25]=onNews;row[29]=newsMap[email]||""; found=true; } });
    if (!found) rows.push(["form_"+email.replace(/[^a-z0-9]/gi,"").slice(0,12),w.name,w.email,w.phone,w.date,w.date,"","","","","","","","","","","","","","/beta/",1,"","","","direct","","","yes",onNews,w.date,newsMap[email]||""]);
  });

  if (rows.length > 0) sh.getRange(2,1,rows.length,rows[0].length).setValues(rows);
  sh.autoResizeColumns(1, sh.getLastColumn());
  Logger.log("USER_PROFILES: " + rows.length + " users");
}

// ── Sheet bootstrap ───────────────────────────────────────────────────────────
function ensureAllSheets(ss) {
  Object.keys(COLS).forEach(function(key) { ensureSheet(ss, S[key], COLS[key]); });
  ensureSheet(ss, S.DASH, []);
}

function ensureSheet(ss, name, headers) {
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    if (headers && headers.length) {
      var r = sh.getRange(1,1,1,headers.length);
      r.setValues([headers]).setFontWeight("bold").setBackground("#0C0A09").setFontColor("#FFFFFF");
      sh.setFrozenRows(1);
    }
  }
  return sh;
}

// ── Summary stats ─────────────────────────────────────────────────────────────
function writeSummaryStats(ss, dash) {
  var uniqueSh  = ss.getSheetByName(S.UNIQUE);
  var rawSh     = ss.getSheetByName(S.RAW);
  var waitSh    = ss.getSheetByName(S.WAITLIST);
  var newsSh    = ss.getSheetByName(S.NEWS);
  var sessionSh = ss.getSheetByName(S.SESSION);
  var unique    = uniqueSh  ? Math.max(0, uniqueSh.getLastRow()-1)  : 0;
  var total     = rawSh     ? Math.max(0, rawSh.getLastRow()-1)     : 0;
  var waitlist  = waitSh    ? Math.max(0, waitSh.getLastRow()-1)    : 0;
  var news      = newsSh    ? Math.max(0, newsSh.getLastRow()-1)    : 0;
  var avgTime   = 0;
  if (sessionSh && sessionSh.getLastRow() > 1) {
    var times = sessionSh.getRange(2,3,sessionSh.getLastRow()-1,1).getValues();
    var sum=0,cnt=0; times.forEach(function(r){if(r[0]>0){sum+=r[0];cnt++;}});
    avgTime = cnt>0 ? Math.round(sum/cnt) : 0;
  }
  var stats = [["👤 Unique Visitors",unique],["📊 Total Page Visits",total],["📋 Waitlist",waitlist],["📧 Newsletter",news],["⏱ Avg Time (s)",avgTime]];
  dash.getRange("A1").setValue("TekPik Analytics — Updated: "+new Date().toLocaleString()).setFontSize(12).setFontWeight("bold");
  stats.forEach(function(s,i){
    var col=(i*2)+1;
    dash.getRange(2,col).setValue(s[0]).setFontWeight("bold").setFontSize(9).setFontColor("#57534E");
    dash.getRange(3,col).setValue(s[1]).setFontSize(18).setFontWeight("bold").setFontColor("#2563EB");
  });
}

// ── Dashboard charts ──────────────────────────────────────────────────────────
var CHART_REGISTRY_KEY = "tp_charts_built";

function rebuildDashboard(ss) {
  var dash = ss.getSheetByName(S.DASH);
  var built = {};
  try { built = JSON.parse(PropertiesService.getScriptProperties().getProperty(CHART_REGISTRY_KEY)||"{}"); } catch(e){}
  writeSummaryStats(ss, dash);
  if (!built["device_pie"])      { makePie(ss,dash,S.DEVICES,1,5,"Device Types",4,1);         built["device_pie"]=true; }
  if (!built["os_pie"])          { makePie(ss,dash,S.DEVICES,3,5,"OS Breakdown",4,3);          built["os_pie"]=true; }
  if (!built["traffic_pie"])     { makePie(ss,dash,S.SOURCES,1,3,"Traffic Sources",4,5);       built["traffic_pie"]=true; }
  if (!built["browser_pie"])     { makePie(ss,dash,S.DEVICES,4,5,"Browser Breakdown",4,7);     built["browser_pie"]=true; }
  if (!built["scroll_col"])      { makeScrollDepthChart(ss,dash,4,9);                          built["scroll_col"]=true; }
  if (!built["pages_bar"])       { makeBar(ss,dash,S.PAGES,1,3,"Top Pages",4,11);              built["pages_bar"]=true; }
  if (!built["newreturn_pie"])   { makeNewReturnPie(ss,dash,21,1);                             built["newreturn_pie"]=true; }
  if (!built["geo_bar"])         { makeBar(ss,dash,S.GEO,1,4,"Top Countries",21,3);            built["geo_bar"]=true; }
  if (!built["newsletter_area"]) { makeAreaChart(ss,dash,S.NEWS,1,"Newsletter Signups",21,5);  built["newsletter_area"]=true; }
  if (!built["cities_col"])      { makeColumn(ss,dash,S.GEO,3,4,"Top Cities",21,7);            built["cities_col"]=true; }
  if (!built["visits_line"])     { makeTimeLine(ss,dash,S.RAW,1,"Daily Visits",38,1);          built["visits_line"]=true; }
  if (!built["waitlist_area"])   { makeAreaChart(ss,dash,S.WAITLIST,1,"Waitlist Growth",38,7); built["waitlist_area"]=true; }
  if (!built["cookie_pie"])      { makePie(ss,dash,S.COOKIES,1,2,"Cookie Consent",55,1);       built["cookie_pie"]=true; }
  if (!built["sessions_line"])   { makeTimeLine(ss,dash,S.SESSION,1,"Daily Sessions",55,7);    built["sessions_line"]=true; }
  PropertiesService.getScriptProperties().setProperty(CHART_REGISTRY_KEY, JSON.stringify(built));
}

function forceRebuildDashboard() {
  var ui=SpreadsheetApp.getUi();
  if (ui.alert("Reset all charts to default layout?",ui.ButtonSet.YES_NO)!==ui.Button.YES) return;
  var ss=SpreadsheetApp.getActiveSpreadsheet();
  var dash=ss.getSheetByName(S.DASH);
  dash.getCharts().forEach(function(c){dash.removeChart(c);});
  dash.clearContents();
  dash.getRange(1,20,dash.getMaxRows(),22).clearContent();
  PropertiesService.getScriptProperties().deleteProperty(CHART_REGISTRY_KEY);
  rebuildDashboard(ss);
  ui.alert("Dashboard rebuilt.");
}

// ── Chart builders ────────────────────────────────────────────────────────────
function makePie(ss,dash,src,lCol,cCol,title,aRow,aCol) {
  var sh=ss.getSheetByName(src); if(!sh||sh.getLastRow()<2) return;
  dash.insertChart(dash.newChart().setChartType(Charts.ChartType.PIE)
    .addRange(sh.getRange(2,lCol,sh.getLastRow()-1,1))
    .addRange(sh.getRange(2,cCol,sh.getLastRow()-1,1))
    .setOption("title",title).setOption("pieHole",0.4)
    .setOption("colors",["#2563EB","#16A34A","#EA580C","#7C3AED","#0C0A09","#A8A29E","#FBBF24","#06B6D4"])
    .setOption("legend",{position:"right"}).setOption("width",480).setOption("height",300)
    .setPosition(aRow,aCol,0,0).build());
}

function makeBar(ss,dash,src,lCol,cCol,title,aRow,aCol) {
  var sh=ss.getSheetByName(src); if(!sh||sh.getLastRow()<2) return;
  dash.insertChart(dash.newChart().setChartType(Charts.ChartType.BAR)
    .addRange(sh.getRange(2,lCol,sh.getLastRow()-1,1))
    .addRange(sh.getRange(2,cCol,sh.getLastRow()-1,1))
    .setOption("title",title).setOption("colors",["#2563EB"]).setOption("legend",{position:"none"})
    .setOption("width",480).setOption("height",300).setPosition(aRow,aCol,0,0).build());
}

function makeColumn(ss,dash,src,lCol,cCol,title,aRow,aCol) {
  var sh=ss.getSheetByName(src); if(!sh||sh.getLastRow()<2) return;
  dash.insertChart(dash.newChart().setChartType(Charts.ChartType.COLUMN)
    .addRange(sh.getRange(2,lCol,sh.getLastRow()-1,1))
    .addRange(sh.getRange(2,cCol,sh.getLastRow()-1,1))
    .setOption("title",title).setOption("colors",["#7C3AED"]).setOption("legend",{position:"none"})
    .setOption("width",480).setOption("height",300).setPosition(aRow,aCol,0,0).build());
}

function makeTimeLine(ss,dash,src,tsCol,title,aRow,aCol) {
  var sh=ss.getSheetByName(src); if(!sh||sh.getLastRow()<2) return;
  var rows=sh.getRange(2,tsCol,sh.getLastRow()-1,1).getValues();
  var counts={}; rows.forEach(function(r){if(!r[0])return;var d=r[0].toString().slice(0,10);counts[d]=(counts[d]||0)+1;});
  var keys=Object.keys(counts).sort(); if(keys.length<2) return;
  var sCol=aCol===1?20:26; dash.getRange(aRow,sCol,200,2).clearContent();
  dash.getRange(aRow,sCol).setValue("Date"); dash.getRange(aRow,sCol+1).setValue("Count");
  keys.forEach(function(k,i){dash.getRange(aRow+1+i,sCol).setValue(k);dash.getRange(aRow+1+i,sCol+1).setValue(counts[k]);});
  dash.insertChart(dash.newChart().setChartType(Charts.ChartType.LINE)
    .addRange(dash.getRange(aRow,sCol,keys.length+1,1))
    .addRange(dash.getRange(aRow,sCol+1,keys.length+1,1))
    .setOption("title",title).setOption("colors",["#2563EB"]).setOption("legend",{position:"none"})
    .setOption("curveType","function").setOption("pointSize",4)
    .setOption("width",480).setOption("height",300).setPosition(aRow,aCol,0,0).build());
}

function makeAreaChart(ss,dash,src,tsCol,title,aRow,aCol) {
  var sh=ss.getSheetByName(src); if(!sh||sh.getLastRow()<2) return;
  var rows=sh.getRange(2,tsCol,sh.getLastRow()-1,1).getValues();
  var counts={}; rows.forEach(function(r){if(!r[0])return;var d=r[0].toString().slice(0,10);counts[d]=(counts[d]||0)+1;});
  var keys=Object.keys(counts).sort(); if(keys.length<1) return;
  var sCol=aCol===1?28:31; dash.getRange(aRow,sCol,200,2).clearContent();
  dash.getRange(aRow,sCol).setValue("Date"); dash.getRange(aRow,sCol+1).setValue("Total");
  var cum=0; keys.forEach(function(k,i){cum+=counts[k];dash.getRange(aRow+1+i,sCol).setValue(k);dash.getRange(aRow+1+i,sCol+1).setValue(cum);});
  dash.insertChart(dash.newChart().setChartType(Charts.ChartType.AREA)
    .addRange(dash.getRange(aRow,sCol,keys.length+1,1))
    .addRange(dash.getRange(aRow,sCol+1,keys.length+1,1))
    .setOption("title",title).setOption("colors",["#16A34A"]).setOption("areaOpacity",0.2)
    .setOption("curveType","function").setOption("width",480).setOption("height",300)
    .setPosition(aRow,aCol,0,0).build());
}

function makeNewReturnPie(ss,dash,aRow,aCol) {
  var sh=ss.getSheetByName(S.UNIQUE); if(!sh||sh.getLastRow()<2) return;
  var rows=sh.getRange(2,15,sh.getLastRow()-1,1).getValues();
  var nw=0,rt=0; rows.forEach(function(r){if(r[0]==="yes"||r[0]===true)nw++;else rt++;});
  if(nw+rt===0) return;
  var sCol=34; dash.getRange(aRow,sCol,10,2).clearContent();
  dash.getRange(aRow,sCol).setValue("Type"); dash.getRange(aRow,sCol+1).setValue("Count");
  dash.getRange(aRow+1,sCol).setValue("New"); dash.getRange(aRow+1,sCol+1).setValue(nw);
  dash.getRange(aRow+2,sCol).setValue("Returning"); dash.getRange(aRow+2,sCol+1).setValue(rt);
  dash.insertChart(dash.newChart().setChartType(Charts.ChartType.PIE)
    .addRange(dash.getRange(aRow,sCol,3,1)).addRange(dash.getRange(aRow,sCol+1,3,1))
    .setOption("title","New vs Returning").setOption("pieHole",0.4)
    .setOption("colors",["#2563EB","#EA580C"]).setOption("width",480).setOption("height",300)
    .setPosition(aRow,aCol,0,0).build());
}

function makeScrollDepthChart(ss,dash,aRow,aCol) {
  var sh=ss.getSheetByName(S.SESSION); if(!sh||sh.getLastRow()<2) return;
  var rows=sh.getRange(2,4,sh.getLastRow()-1,1).getValues();
  var b={"0-25%":0,"26-50%":0,"51-75%":0,"76-100%":0};
  rows.forEach(function(r){var v=parseInt(r[0])||0;if(v<=25)b["0-25%"]++;else if(v<=50)b["26-50%"]++;else if(v<=75)b["51-75%"]++;else b["76-100%"]++;});
  var sCol=36; dash.getRange(aRow,sCol,10,2).clearContent();
  dash.getRange(aRow,sCol).setValue("Depth"); dash.getRange(aRow,sCol+1).setValue("Sessions");
  Object.keys(b).forEach(function(k,i){dash.getRange(aRow+1+i,sCol).setValue(k);dash.getRange(aRow+1+i,sCol+1).setValue(b[k]);});
  dash.insertChart(dash.newChart().setChartType(Charts.ChartType.COLUMN)
    .addRange(dash.getRange(aRow,sCol,5,1)).addRange(dash.getRange(aRow,sCol+1,5,1))
    .setOption("title","Scroll Depth").setOption("colors",["#7C3AED"]).setOption("legend",{position:"none"})
    .setOption("width",480).setOption("height",300).setPosition(aRow,aCol,0,0).build());
}

// ── Menu ──────────────────────────────────────────────────────────────────────
function onOpen() { createMenu(); }

function createMenu() {
  SpreadsheetApp.getUi()
    .createMenu("🛠 TekPik Admin")
    .addItem("▶ Sync Now (pull from Firestore)",             "syncAll")
    .addItem("👥 Rebuild User Profiles + Campaigns",         "buildUserProfilesMenu")
    .addItem("🔄 Refresh Stats Only",                        "refreshStatsOnly")
    .addItem("📊 Add Missing Charts (keeps colors)",         "refreshDashboard")
    .addItem("🔁 Force Full Rebuild (resets layout+colors)", "forceRebuildDashboard")
    .addSeparator()
    .addSubMenu(SpreadsheetApp.getUi().createMenu("➕ Insert Custom Row")
      .addItem("Insert into RAW_VISITS",  "insertCustomVisit")
      .addItem("Insert into WAITLIST",    "insertCustomWaitlist")
      .addItem("Insert into NEWSLETTER",  "insertCustomNewsletter"))
    .addSeparator()
    .addSubMenu(SpreadsheetApp.getUi().createMenu("🗑 Delete Data")
      .addItem("Delete selected rows",          "deleteSelectedRows")
      .addItem("Clear RAW_VISITS",              "clearRawVisits")
      .addItem("Clear WAITLIST",                "clearWaitlist")
      .addItem("Clear NEWSLETTER",              "clearNewsletter")
      .addItem("⚠ Clear ALL sheets",           "clearAllSheets"))
    .addSeparator()
    .addItem("🔄 Reset & Re-sync all Firestore data", "resetAndResync")
    .addToUi();
}

// ── Insert helpers ────────────────────────────────────────────────────────────
function insertCustomVisit() {
  var ui=SpreadsheetApp.getUi();
  var page=ui.prompt("Page path (e.g. /beta/)").getResponseText();
  var source=ui.prompt("Source (e.g. google, instagram)").getResponseText();
  var country=ui.prompt("Country").getResponseText();
  var device=ui.prompt("Device (mobile/desktop)").getResponseText();
  if(!page) return;
  var ss=SpreadsheetApp.getActiveSpreadsheet();
  var row=new Array(41).fill("");
  row[0]=new Date().toISOString(); row[1]=page; row[5]=source||"direct";
  row[10]=country||""; row[16]=device||"desktop"; row[40]="MANUAL_"+Date.now();
  ss.getSheetByName(S.RAW).appendRow(row);
  ui.alert("Row inserted.");
}

function insertCustomWaitlist() {
  var ui=SpreadsheetApp.getUi();
  var name=ui.prompt("Full Name").getResponseText();
  var email=ui.prompt("Email").getResponseText();
  var phone=ui.prompt("Phone").getResponseText();
  if(!email) return;
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName(S.WAITLIST)
    .appendRow([new Date().toISOString(),name||"",email,phone||"","/beta/","manual","MANUAL_"+Date.now()]);
  SpreadsheetApp.getUi().alert("Row inserted.");
}

function insertCustomNewsletter() {
  var ui=SpreadsheetApp.getUi();
  var email=ui.prompt("Email address").getResponseText();
  if(!email) return;
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName(S.NEWS)
    .appendRow([new Date().toISOString(),email,"/","manual","MANUAL_"+Date.now()]);
  SpreadsheetApp.getUi().alert("Row inserted.");
}

// ── Delete helpers ────────────────────────────────────────────────────────────
function deleteSelectedRows() {
  var sh=SpreadsheetApp.getActiveSheet(); var sel=sh.getActiveRange();
  if(!sel){SpreadsheetApp.getUi().alert("Select rows first.");return;}
  var ui=SpreadsheetApp.getUi();
  if(ui.alert("Delete "+sel.getNumRows()+" row(s)?",ui.ButtonSet.YES_NO)!==ui.Button.YES) return;
  for(var i=sel.getRow()+sel.getNumRows()-1;i>=sel.getRow();i--){if(i>1)sh.deleteRow(i);}
}

function clearRawVisits()  { clearSheetData(S.RAW); }
function clearWaitlist()   { clearSheetData(S.WAITLIST); }
function clearNewsletter() { clearSheetData(S.NEWS); }

function clearAllSheets() {
  var ui=SpreadsheetApp.getUi();
  if(ui.alert("⚠ Delete ALL data rows from every sheet?",ui.ButtonSet.YES_NO)!==ui.Button.YES) return;
  [S.RAW,S.SESSION,S.WAITLIST,S.NEWS,S.CONSENT,S.SOURCES,S.GEO,S.DEVICES,S.PAGES,S.COOKIES,S.UNIQUE,S.USERS,S.CAMPAIGNS].forEach(clearSheetData);
  var dash=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(S.DASH);
  if(dash) dash.getRange(1,20,dash.getMaxRows(),22).clearContent();
  PropertiesService.getScriptProperties().deleteProperty(CHART_REGISTRY_KEY);
  ui.alert("All data cleared.");
}

function clearSheetData(name) {
  var sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if(sh&&sh.getLastRow()>1) sh.deleteRows(2,sh.getLastRow()-1);
}

// ── Reset & Re-sync ───────────────────────────────────────────────────────────
function resetAndResync() {
  clearAllSheets();
  ["visits","session_ends","waitlist","newsletter","consent_events"].forEach(function(col){
    var token=ScriptApp.getOAuthToken(); var pt=null;
    do {
      var url=FIRESTORE_BASE+"/"+col+"?pageSize=50"; if(pt) url+="&pageToken="+pt;
      var res=UrlFetchApp.fetch(url,{headers:{Authorization:"Bearer "+token},muteHttpExceptions:true});
      if(res.getResponseCode()!==200) break;
      var data=JSON.parse(res.getContentText()); if(!data.documents) break;
      data.documents.forEach(function(doc){
        var sp=doc.name.split("/documents/")[1];
        UrlFetchApp.fetch(FIRESTORE_BASE+"/"+sp+"?updateMask.fieldPaths=_synced",{
          method:"PATCH",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},
          payload:JSON.stringify({fields:{_synced:{booleanValue:false}}}),muteHttpExceptions:true});
      });
      pt=data.nextPageToken||null;
    } while(pt);
  });
  SpreadsheetApp.getUi().alert("Reset done. Run Sync Now to re-populate.");
}

// ── Setup ─────────────────────────────────────────────────────────────────────
function setup() {
  var ss=SpreadsheetApp.getActiveSpreadsheet();
  ensureAllSheets(ss);
  installTrigger();
  createMenu();
  SpreadsheetApp.getUi().alert("TekPik: all sheets created and trigger installed.");
}
