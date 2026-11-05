# Oceanian Electoral Calendar

A rolling calendar of elections in Oceania: the past six months (collapsed) and the next six months, with an interactive map, filters by election type, and results for past elections where supplied in the spreadsheet.

## How it works

- A scheduled GitHub Action (`.github/workflows/update-data.yml`) reads the Google Sheet every three hours using a short-lived Google access token and writes the merged events to `data.json`.
- `index.html` loads only `data.json`; the Google Sheet ID is stored as a repository secret and is not published on the website.
- To refresh immediately: **Actions → Update election data → Run workflow**.

## Set up the repository

1. Create the repository `Europe-Elects/oceanian_calendar` (or adjust the Pages URL below if you choose another name).
2. Upload the contents of this repository to the root of the `main` branch, including the hidden `.github/workflows` directory.
3. Share the source Google Sheet with `ee-sheets-reader@project-6c08a079-4a01-46eb-aaf.iam.gserviceaccount.com` as **Viewer**. Disable the notification email if desired.
4. In **Settings → Secrets and variables → Actions**, create these repository secrets:
   - `SHEET_ID`: the spreadsheet ID from the normal editing URL, between `/spreadsheets/d/` and `/edit`.
   - `SHEET_GID`: the numeric `gid` of the worksheet tab containing the calendar data. Use `0` if it is the first tab and its gid is 0; otherwise use the actual tab gid.
5. In **Settings → Pages**, select **Deploy from a branch**, branch `main`, folder `/ (root)`.
6. In **Actions → Update election data**, select **Run workflow**. Check the run log and confirm that `data.json` is updated.

The expected GitHub Pages address for the repository name `oceanian_calendar` is:

`https://europe-elects.github.io/oceanian_calendar/`

## Google authentication note

The workflow reuses Europe Elects' existing Google Workload Identity Provider and service account. The provider's repository/branch conditions must permit `Europe-Elects/oceanian_calendar` on `main`. If the authentication step fails with a Workload Identity Federation or permission error, an administrator of the Google Cloud Workload Identity Provider must add this repository to its allowed GitHub identity conditions. The service account must also retain read access to the spreadsheet.

## Spreadsheet format

The first row must contain these headers (additional leading columns are allowed):

- `Country`
- `Specification`
- `Type`
- `Mode`
- `Sequence`
- `(Expected) Date`
- `Date Status`
- `Comment`
- `Result`

An optional first column can contain an ISO-2 flag code in the format `:AU:`, `:NZ:`, etc. The script detects this format anywhere in the row.

Dates may be `12 November 2026`, `2026-11-12`, or day-first `12/11/2026`. `Date Status` must be exactly `Confirmed` for a confirmed date; other values are displayed as tentative (`tbc`). For month-only or approximate dates, put a placeholder date in the date column and preserve the original wording (for example `By August` or `~March`) in `Comment`; the calendar displays the comment alongside the event. The placeholder itself is not represented as an exact confirmed date.

The `Type` column accepts both the calendar's descriptive values (for example `national parliament`, `head of state/presidential`, `regional parliament`, `local (nationwide)`, `national referendum`) and the shorter values `National`, `Presidential`, `Regional`, `Local`, and `Referendum`. For `National`, the script uses the `Mode` and `Specification` fields to distinguish parliamentary from presidential/head-of-state contests. Use `Indirect` in `Mode` for indirectly elected offices.

`Comment` = `Not Free/Fair` adds the corresponding tag; any other comment is displayed as a note. `Result` is shown on the event. Where multiple rounds are merged, the latest supplied result is retained.

## Files

- `index.html` — calendar interface, filters, map and styling.
- `build-data.mjs` — reads the Google Sheet through the Sheets API.
- `merge.mjs` — parses the sheet and merges rows into calendar events.
- `data.json` — generated data consumed by the page; do not manually maintain it.
- `.github/workflows/update-data.yml` — scheduled and manual update workflow.
