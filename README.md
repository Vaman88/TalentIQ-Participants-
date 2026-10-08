# TalentIQ participant check-in

A mobile-friendly career fair form with university/major suggestions, PDF/DOCX selection (8 MB), camera scanning, and a completion screen.

Submit validates the form and shows completion locally. Candidate details and resumes are not saved or sent to a database or recruiter. No Supabase connection or environment variables are required.

Camera scans still send a photo to this app's server for OCR. Unreadable scans show a warning and block submission. Successful scans produce a searchable PDF in memory; photos and PDFs are not persisted.

## Run

Run npm ci, then npm run dev. Open http://localhost:3000.

## Netlify

Connect the master branch of https://github.com/Vaman88/TalentIQ-Participants-.git. The root netlify.toml sets npm run build, .next, and Node 24. Use Netlify's Next.js runtime for camera OCR. No database credentials are needed.

## Files

- app/page.tsx: form, upload, camera, and completion UI.
- app/actions.ts: OCR action only.
- lib/resumeScan.ts and lib/scanValidation.ts: text extraction and readability checks.
- app/layout.tsx and app/globals.css: page shell and styling.

## Checks

Run npm run build, npm run lint, npm test, and npm run test:scan.
