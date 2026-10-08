"use server";

import { extractResumeScan } from "@/lib/resumeScan";

export async function scanResumeServer(formData: FormData) {
  const photo = formData.get("photo");
  if (!(photo instanceof File)) return { success: false as const, error: "Scan a resume photo first." };
  try {
    const result = await extractResumeScan(photo);
    return { success: true as const, pdf: result.pdf.toString("base64"), text: result.text, confidence: result.confidence };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Text extraction failed. Please retake the photo." };
  }
}
