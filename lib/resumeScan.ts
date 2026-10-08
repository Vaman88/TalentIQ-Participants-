import "server-only";
import { createRequire } from "node:module";
import sharp from "sharp";
import { createWorker, OEM, type Worker } from "tesseract.js";
import { validateScanText } from "./scanValidation";

const localRequire = createRequire(`${process.cwd()}/package.json`);
let activeScans = 0;

class ScanWarning extends Error {}

export async function extractResumeScan(image: File) {
  if (!image.size || image.size > 8 * 1024 * 1024) throw new ScanWarning("The photo must be no larger than 8 MB.");
  if (!["image/jpeg", "image/png"].includes(image.type)) throw new ScanWarning("Use a JPEG or PNG photo of your resume.");
  if (activeScans >= 2) throw new ScanWarning("The scanner is busy. Please try again in a moment.");
  activeScans++;
  let worker: Worker | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let timedOut = false;
  try {
    const work = async () => {
      const bytes = Buffer.from(await image.arrayBuffer());
      const original = sharp(bytes, { limitInputPixels: 24_000_000, failOn: "error" });
      const metadata = await original.metadata();
      if (!["jpeg", "png"].includes(metadata.format ?? "") || (metadata.pages ?? 1) !== 1) throw new ScanWarning("Use a single JPEG or PNG resume photo.");
      if (Math.min(metadata.width ?? 0, metadata.height ?? 0) < 800 || Math.max(metadata.width ?? 0, metadata.height ?? 0) < 1100) {
        throw new ScanWarning("The photo resolution is too low. Retake it at full resolution with the resume filling the frame.");
      }
      const oriented = await original.rotate().flatten({ background: "white" }).resize({ width: 2400, height: 3200, fit: "inside", withoutEnlargement: true }).png().toBuffer();
      const stats = await sharp(oriented).greyscale().stats();
      const channel = stats.channels[0];
      if (channel.mean < 45 || channel.stdev < 18) throw new ScanWarning("The image is too dark or has too little contrast. Use even lighting and avoid glare.");
      const prepared = await sharp(oriented).greyscale().normalize().png().toBuffer();
      if (timedOut) throw new ScanWarning("Text extraction timed out. Please try again.");
      worker = await createWorker("eng", OEM.LSTM_ONLY, {
        workerPath: localRequire.resolve("tesseract.js/src/worker-script/node/index.js"),
        langPath: `${process.cwd()}/node_modules/@tesseract.js-data/eng/4.0.0`,
        cacheMethod: "none",
        errorHandler: () => { /* Tesseract rejects the job; return a safe warning below. */ },
      });
      if (timedOut) { await worker.terminate(); throw new ScanWarning("Text extraction timed out. Please try again."); }
      const { data } = await worker.recognize(prepared, { rotateAuto: true, pdfTitle: "Scanned resume", pdfTextOnly: false }, { text: true, blocks: true, pdf: true });
      const confidences = (data.blocks ?? []).flatMap(block => block.paragraphs.flatMap(paragraph => paragraph.lines.flatMap(line => line.words.map(word => word.confidence))));
      const warning = validateScanText(data.text, data.confidence, confidences);
      if (warning) throw new ScanWarning(warning);
      if (!data.pdf?.length) throw new ScanWarning("The scanned resume could not be created. Please retake the photo.");
      const pdf = Buffer.from(data.pdf);
      if (pdf.length > 8 * 1024 * 1024) throw new ScanWarning("The scanned resume exceeds 8 MB. Retake the photo or upload a PDF instead.");
      return { pdf, text: data.text.trim(), confidence: Math.round(data.confidence) };
    };
    return await Promise.race([
      work(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          timedOut = true;
          reject(new ScanWarning("Text extraction timed out. Retake the photo or upload your resume instead."));
        }, 60_000);
      }),
    ]);
  } catch (error) {
    if (error instanceof ScanWarning) throw error;
    throw new ScanWarning("Text extraction failed. Retake a clear photo or upload your PDF or DOCX resume.");
  } finally {
    if (timer) clearTimeout(timer);
    if (worker) await worker.terminate().catch(() => {});
    activeScans--;
  }
}
