# TalentIQ participant check-in

A mobile-friendly career fair form with university/major suggestions, PDF/DOCX uploads (8 MB), camera scanning, and a confirmation screen. Candidate details and resumes are saved to Supabase; timestamps are stored in UTC and displayed in Central Time.

## Main files

- app/page.tsx: all website UI, including upload, camera, and confirmation.
- app/actions.ts: server-side check-in and scan actions; secrets stay on the server.
- lib/: OCR, readability checks, scan verification, and time formatting.
- app/layout.tsx and app/globals.css: required page shell and styling.
- netlify.toml: deployment settings.

## Run locally

1. Run npm ci.
2. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
3. Run npm run dev and open http://localhost:3000.

Supabase needs a resumes storage bucket and the responses table. Apply the SQL files in supabase/migrations in filename order when setting up the database.

## Netlify

Connect https://github.com/Vaman88/TalentIQ-Participants-.git and use the master production branch. Deploy from Git, with the repository root as the base, npm run build as the build command, and .next as the publish directory. netlify.toml sets these values and Node 24. Netlify's automatic Next.js adapter runs the server actions.

Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Netlify with Builds and Functions scopes, then redeploy. Never commit .env.local or expose the service-role key in browser code.

## Resume scans

Camera access requires HTTPS or localhost. Readable scans become searchable PDFs. Failed extraction, low resolution, poor contrast, or unreliable text show a warning and block submission. Scan proofs expire after 30 minutes; the user can review extracted text before submitting.

## Checks

- npm run build
- npm run lint
- npm test
- npm run test:scan (actual OCR and image rejection checks)

Presentation files remain local but are excluded from this website repository.
