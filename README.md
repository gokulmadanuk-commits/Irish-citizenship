# Irish Citizenship Tracker

A private, offline-first app that tracks an Irish citizenship application made as
the **spouse or civil partner of an Irish citizen**, for someone living in **Northern Ireland**.

You add your details, log your trips away, and upload scans of your documents.
The app reads each document, checks it against the rules, and tells you exactly
what is still missing.

## Your documents never leave your computer

- Files are stored in your browser's own database (IndexedDB) on this device.
- Text is read from documents on this device, using pdf.js and Tesseract OCR in the browser.
- There is no server, no account, and no upload. Turn off your internet and it still works.
- "Erase all data" in the top bar deletes everything, including the stored files.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:5173

Other commands:

```bash
npm run build     # production build into dist/
npm run preview   # serve the production build
npm test          # run the rules engine tests
```

## What is in here

| Path | What it does |
| --- | --- |
| `src/rules/ruleset.ts` | Every legal number and rule, in one place, with sources |
| `src/rules/documents.ts` | The document catalogue and what makes each document acceptable |
| `src/rules/engine.ts` | The rules engine: works out where you stand |
| `src/rules/checks.ts` | Runs each document's acceptance tests against its text |
| `src/lib/extract.ts` | Reads text out of PDFs and scans, on this device |
| `src/lib/dates.ts` | Day counting for residence and trips away |
| `src/components/` | The screens |

## How the checks work

1. **Your details** set the application date, the wedding date and the arrival date.
2. **Trips away** are subtracted from your days on the island of Ireland.
   England, Scotland and Wales are *not* on the island of Ireland, so trips there count as time away.
3. **Documents** are read on this device. Each document type has acceptance tests
   (your name is on it, an island of Ireland address is on it, it is dated inside the period it covers).
4. **The engine** puts these together, checks every rule, and builds your next-steps list.

Where the app cannot read a document, it says so and asks you to confirm it by hand.
It never silently passes something it could not check.

## Important

This app is a tracker, not legal advice. The rules and fees change.
Always confirm against the official sources listed on the "The rules" screen
before you submit anything.
