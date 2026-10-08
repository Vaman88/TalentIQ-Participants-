This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Camera resume scans

The main check-in form has two options: **Upload resume** opens the PDF/DOCX file picker (up to 8 MB), and **Scan resume** opens a live camera with capture/retake controls. PDF/DOCX drag-and-drop is also supported. Live camera access requires localhost or HTTPS and camera permission.

Scans are processed on the application server with local English Tesseract language data, without an external OCR API. Images must be at least 800 pixels on the short edge and 1100 on the long edge, and pass exposure/contrast checks. Extracted text must contain at least 60 words and 350 characters, a recognizable resume section, an overall OCR confidence of 70, and at least 75% of detected words with confidence of 65 or higher. These are conservative heuristics; review the extracted text for missing or incorrect details before submitting. Multiple-page resumes should be uploaded as PDF/DOCX.

Unreadable images and extraction errors display a warning and block submission. Successful scans become searchable PDFs for the existing Supabase resume workflow. A signed proof binds the validated PDF to its contents for 30 minutes and is checked again at submission. Replacing/removing a scan clears its approval. Only the PDF is persisted on submission, with `resume_source: camera_scan` in storage metadata; unsuccessful photos are not stored. No database migration or additional API key is required.

Run scan checks with `node --test tests/resume-scan.test.js` and `node --conditions=react-server --test tests/resume-scan.integration.test.js`. The integration test runs actual OCR on synthetic resume images and checks unreadable-image rejection.

## Supabase responses table

The check-in form stores the submission time as `responses.checkin_time` (a `timestamptz` value in UTC). Use `responses.checkin_time_central` in the Supabase table editor to see Central Time formatted as `8:41 am` or `8:41 pm`, without seconds. This generated display column automatically converts existing and new check-ins using `America/Chicago`, including daylight saving time. Apply the SQL files in `supabase/migrations` in filename order in the Supabase SQL Editor, or set `DATABASE_URL` to your Supabase Postgres connection string and run `node alter_db.js`. The check-in time migration fills existing responses from `created_at` and gives new rows a database default.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

Resume metadata includes the validated Central Time string in `checkin_time` and the original instant in `checkin_time_utc`. The candidate time migration also normalizes `candidates.checkin_time` before inserts and updates, converting timezone-qualified ISO timestamps to Central Time and enforcing `h:mm am/pm` without seconds. The candidate website should display that text directly.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Netlify

Connect this repository using the `master` production branch. The root `netlify.toml` sets the base directory to the repository root, build command to `npm run build`, publish directory to `.next`, and Node.js version to 24. Netlify automatically applies its Next.js adapter, which is required for the form's Server Actions. Deploy through the connected Git repository rather than uploading the source folder as a static site.

Add `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Netlify's environment variable settings, with **Builds and Functions** scopes. If using the browser Supabase client, also add `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Use the same project values as your local `.env.local`; that file is intentionally excluded from Git. Keep the service-role key server-only. Redeploy after adding or changing these variables.

A Netlify-branded 404 at the homepage means the app is not being served by the Next.js deployment. Confirm the connected repository and branch, root base directory, `.next` publish directory, and a successful production deploy with the Next.js adapter enabled.

## Vercel deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
