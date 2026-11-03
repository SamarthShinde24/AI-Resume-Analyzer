import { describe, it, expect } from "vitest";
import { extractResumeText } from "../../services/pdfParser.js";

describe("Document Parser Unit Tests (pdfParser.js)", () => {
  it("extracts text cleanly from plain text (.txt) files", async () => {
    const rawText = "Senior Full-Stack Developer with experience in React and Node.js.";
    const buffer = Buffer.from(rawText, "utf-8");

    const extracted = await extractResumeText(buffer, "text/plain", "resume.txt");
    expect(extracted).toBe(rawText);
  });

  it("extracts text cleanly from markdown (.md) files", async () => {
    const rawText = "# Jane Doe\n## Experience\n- Lead Engineer at TechCorp";
    const buffer = Buffer.from(rawText, "utf-8");

    const extracted = await extractResumeText(buffer, "text/markdown", "resume.md");
    expect(extracted).toContain("Jane Doe");
    expect(extracted).toContain("Lead Engineer");
  });

  it("handles empty text buffers gracefully without crashing", async () => {
    const buffer = Buffer.from("", "utf-8");
    const extracted = await extractResumeText(buffer, "text/plain", "empty.txt");
    expect(extracted).toBe("");
  });

  it("throws a descriptive error when encountering a corrupt or malformed PDF buffer", async () => {
    const corruptBuffer = Buffer.from("NOT_A_VALID_PDF_HEADER_CONTENT_GARBAGE", "utf-8");

    await expect(
      extractResumeText(corruptBuffer, "application/pdf", "corrupt.pdf")
    ).rejects.toThrow(/Failed to parse PDF document/);
  });

  it("throws a descriptive error when encountering a corrupt Word DOCX buffer", async () => {
    const corruptBuffer = Buffer.from("NOT_A_VALID_DOCX_ZIP_ARCHIVE", "utf-8");

    await expect(
      extractResumeText(
        corruptBuffer,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "corrupt.docx"
      )
    ).rejects.toThrow(/Failed to parse Word document/);
  });
});
