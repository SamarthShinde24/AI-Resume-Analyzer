import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import path from "node:path";

/**
 * Extracts plain text from an uploaded resume file buffer.
 * Supports PDF (via pdf-parse), DOCX (via mammoth), and plain text (.txt, .md).
 *
 * @param {Buffer} fileBuffer
 * @param {string} mimetype
 * @param {string} originalname
 * @returns {Promise<string>}
 */
export async function extractResumeText(fileBuffer, mimetype, originalname = "") {
  const ext = path.extname(originalname || "").toLowerCase();

  // 1. PDF Documents
  if (mimetype === "application/pdf" || ext === ".pdf") {
    try {
      const data = await pdfParse(fileBuffer);
      return (data.text || "").trim();
    } catch (err) {
      throw new Error(`Failed to parse PDF document: ${err.message}`);
    }
  }

  // 2. Word Documents (.docx)
  const isWordMime =
    mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimetype === "application/msword";
  const isWordExt = ext === ".docx" || ext === ".doc";

  if (isWordMime || isWordExt) {
    try {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      return (result.value || "").trim();
    } catch (err) {
      throw new Error(`Failed to parse Word document (.docx): ${err.message}`);
    }
  }

  // 3. Fallback: treat as plain text (.txt, markdown, etc.)
  return fileBuffer.toString("utf-8").trim();
}
