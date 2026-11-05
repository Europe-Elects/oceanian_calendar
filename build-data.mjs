// Reads the Oceanian election Google Sheet (keyless Google login) and writes data.json. Run by GitHub Actions.
// The sheet ID comes from the SHEET_ID repository secret, so it never appears in the repo.
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { parseCSV, buildEvents } from "./merge.mjs";

const id = process.env.SHEET_ID;
const gid = process.env.SHEET_GID || "0";
if (!id) { console.error("SHEET_ID secret is not set."); process.exit(1); }

// Read the Sheet through the Sheets API with the short-lived token from the keyless Google login
// (google-github-actions/auth in the workflow). The Sheet only needs to be shared with the robot account.
const token = process.env.GOOGLE_TOKEN;
if (!token) { console.error("GOOGLE_TOKEN is missing (the Google login step didn't run)."); process.exit(1); }
const api = async (path) => {
  for (let attempt = 0; ; attempt++) {
    const r = await fetch("https://sheets.googleapis.com/v4/spreadsheets/" + id + path, { headers: { Authorization: "Bearer " + token } });
    if (r.ok) return r.json();
    if ([400, 403, 404].includes(r.status) || attempt === 3) {
      console.error(`Sheets API HTTP ${r.status}. Is the sheet shared with the robot account (Viewer)? ${(await r.text()).slice(0, 300)}`); process.exit(1);
    }
    await new Promise((ok) => setTimeout(ok, 5000 * (attempt + 1)));
  }
};
const meta = await api("?fields=sheets.properties(sheetId,title)");
const tab = meta.sheets.map((s) => s.properties).find((p) => String(p.sheetId) === String(gid));
if (!tab) { console.error(`No tab with gid ${gid}.`); process.exit(1); }
const { values = [] } = await api("/values/" + encodeURIComponent("'" + tab.title.replace(/'/g, "''") + "'") + "?valueRenderOption=FORMATTED_VALUE");
const q = (v) => { v = String(v ?? ""); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
const text = values.map((row) => row.map(q).join(",")).join("\n");

const events = buildEvents(parseCSV(text));
if (events.length < 10) { console.error(`Only ${events.length} events parsed; refusing to overwrite data.json.`); process.exit(1); }

const body = JSON.stringify(events);
if (existsSync("data.json")) {
  try { if (JSON.stringify(JSON.parse(readFileSync("data.json", "utf8")).events) === body) { console.log("No changes."); process.exit(0); } } catch {}
}
writeFileSync("data.json", JSON.stringify({ updated: new Date().toISOString(), events }));
console.log(`Wrote ${events.length} events.`);
