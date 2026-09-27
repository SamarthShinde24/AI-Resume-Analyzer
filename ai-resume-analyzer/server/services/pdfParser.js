import pdfParse from "pdf-parse";

/**
 * Extracts plain text from an uploaded resume file buffer.
 * Supports PDF (via pdf-parse) and plain text.
 */
export async function extractResumeText(fileBuffer, mimetype) {
  if (mimetype === "application/pdf") {
    const data = await pdfParse(fileBuffer);
    return data.text.trim();
  }

  // Fallback: treat as plain text (.txt uploads)
  return fileBuffer.toString("utf-8").trim();
}
