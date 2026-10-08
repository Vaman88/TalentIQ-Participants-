/** Conservative readability gates, not a guarantee that every character is correct. */
export function validateScanText(text: string, confidence: number, wordConfidences: number[]) {
  const words = text.match(/[A-Za-z][A-Za-z'-]{1,}/g) ?? [];
  if (!text.trim() || words.length < 60 || text.trim().length < 350) {
    return "Too little readable text was found. Include the entire resume, move closer, and retake the photo.";
  }
  const reliable = wordConfidences.filter(value => value >= 65).length;
  if (!Number.isFinite(confidence) || confidence < 70 || wordConfidences.length === 0 || reliable / wordConfidences.length < 0.75) {
    return "The text is not clear enough to submit. Hold the camera steady, avoid glare, and retake the photo in brighter light.";
  }
  const sections = /\b(education|experience|employment|skills|projects|qualifications|summary|objective|certifications)\b/i;
  if (!sections.test(text)) {
    return "We could not identify resume content. Photograph the full resume with its section headings clearly visible.";
  }
  return null;
}
