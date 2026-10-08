"use server";

import { extractResumeScan } from "@/lib/resumeScan";
import { signScan } from "@/lib/scanReceipt";

export async function scanResumeServer(formData: FormData) {
  const photo = formData.get("photo");
  if (!(photo instanceof File)) return { success: false as const, error: "Take or select a resume photo first." };
  try {
    const result = await extractResumeScan(photo);
    const proof = signScan(result.pdf, process.env.SUPABASE_SERVICE_ROLE_KEY ?? "");
    return { success: true as const, pdf: result.pdf.toString("base64"), text: result.text, confidence: result.confidence, proof };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Text extraction failed. Please retake the photo." };
  }
}
