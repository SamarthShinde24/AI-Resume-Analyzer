/**
 * Tailored Resume Document Generator (.docx)
 *
 * Replaces weak resume bullets with AI-optimized rewrites and compiles
 * an ATS-compliant, beautifully styled Microsoft Word (.docx) document
 * with executive typography, standard margins, and section dividers.
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  BorderStyle,
  AlignmentType,
} from "docx";

/**
 * Replaces weak bullet points in the resume text with their AI rewrites.
 *
 * @param {string} resumeText
 * @param {Array<{ original: string, rewrite: string }>} weakBullets
 * @returns {{ updatedText: string, replacedCount: number }}
 */
export function applyBulletRewrites(resumeText, weakBullets = []) {
  if (!resumeText || !Array.isArray(weakBullets) || weakBullets.length === 0) {
    return { updatedText: resumeText || "", replacedCount: 0 };
  }

  let updatedText = resumeText;
  let replacedCount = 0;

  for (const bullet of weakBullets) {
    if (!bullet.original || !bullet.rewrite) continue;

    // Clean leading bullet markers (•, *, -, numbers)
    const cleanOriginal = bullet.original
      .replace(/^[\s•*\-\d.)]+/, "")
      .trim();
    const cleanRewrite = bullet.rewrite
      .replace(/^[\s•*\-\d.)]+/, "")
      .trim();

    if (!cleanOriginal || !cleanRewrite) continue;

    // 1. Exact match attempt
    if (updatedText.includes(bullet.original)) {
      updatedText = updatedText.replace(bullet.original, bullet.rewrite);
      replacedCount++;
      continue;
    }

    // 2. Cleaned original match attempt
    if (updatedText.includes(cleanOriginal)) {
      updatedText = updatedText.replace(cleanOriginal, cleanRewrite);
      replacedCount++;
      continue;
    }

    // 3. Line-by-line fuzzy match (check if line contains first 35 chars of original)
    const sample = cleanOriginal.slice(0, 35);
    const lines = updatedText.split("\n");
    let lineReplaced = false;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(sample)) {
        // Preserve original indentation / bullet marker if any
        const matchPrefix = lines[i].match(/^(\s*[•*\-]?\s*)/);
        const prefix = matchPrefix ? matchPrefix[1] : "• ";
        lines[i] = `${prefix}${cleanRewrite}`;
        lineReplaced = true;
        replacedCount++;
        break;
      }
    }

    if (lineReplaced) {
      updatedText = lines.join("\n");
    }
  }

  return { updatedText, replacedCount };
}

/**
 * Extracts candidate name and contact line from the top of the resume.
 */
function extractHeaderInfo(lines) {
  let name = "";
  let contact = "";
  let startIndex = 0;

  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (!name) {
      name = line;
      startIndex = i + 1;
      continue;
    }

    // Check if line looks like contact information (email, phone, urls)
    if (/@|\+?\d{3}|linkedin|github|portfolio|http/i.test(line)) {
      contact = line;
      startIndex = i + 1;
      break;
    }
  }

  return { name, contact, startIndex };
}

/**
 * Checks if a line is a standard ATS section header.
 */
function isSectionHeader(line) {
  const trimmed = line.trim().toUpperCase();
  const headers = [
    "EXPERIENCE",
    "WORK EXPERIENCE",
    "PROFESSIONAL EXPERIENCE",
    "EMPLOYMENT HISTORY",
    "EDUCATION",
    "SKILLS",
    "TECHNICAL SKILLS",
    "CORE COMPETENCIES",
    "PROJECTS",
    "TECHNICAL PROJECTS",
    "SUMMARY",
    "PROFESSIONAL SUMMARY",
    "CERTIFICATIONS",
  ];
  return headers.includes(trimmed) || (trimmed.length < 30 && /^[A-Z\s/&-]+:?$/.test(trimmed));
}

/**
 * Generates an ATS-compliant Microsoft Word (.docx) binary buffer.
 *
 * @param {object} options
 * @param {string} options.resumeText - Full resume content
 * @param {Array} [options.weakBullets] - Array of weak bullet rewrites
 * @param {string} [options.candidateName] - Optional name override
 * @param {boolean} [options.autoApplyRewrites=true] - Whether to auto-substitute AI rewrites
 * @returns {Promise<Buffer>} Word document binary buffer
 */
export async function generateTailoredDocx({
  resumeText,
  weakBullets = [],
  candidateName = "",
  autoApplyRewrites = true,
}) {
  const { updatedText } = autoApplyRewrites
    ? applyBulletRewrites(resumeText, weakBullets)
    : { updatedText: resumeText };

  const rawLines = updatedText.split("\n").map((l) => l.trimEnd());
  const { name: detectedName, contact, startIndex } = extractHeaderInfo(rawLines);
  const finalName = candidateName || detectedName || "Candidate Resume";

  const paragraphs = [];

  // 1. Candidate Name Header (22pt bold, dark navy #1e293b)
  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: finalName,
          bold: true,
          size: 40, // 20pt (half-points in docx)
          color: "1E293B",
          font: "Calibri",
        }),
      ],
    })
  );

  // 2. Contact Banner (9.5pt, slate #64748b)
  if (contact) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: contact,
            size: 19, // 9.5pt
            color: "64748B",
            font: "Calibri",
          }),
        ],
      })
    );
  }

  // 3. Document Body Parse
  for (let i = startIndex; i < rawLines.length; i++) {
    const line = rawLines[i].trim();
    if (!line) {
      // Empty line adds minor breathing room
      paragraphs.push(new Paragraph({ spacing: { after: 80 } }));
      continue;
    }

    // Section Header (e.g. EXPERIENCE, SKILLS)
    if (isSectionHeader(line)) {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 120 },
          border: {
            bottom: {
              color: "CBD5E1",
              space: 4,
              value: BorderStyle.SINGLE,
              size: 6,
            },
          },
          children: [
            new TextRun({
              text: line.toUpperCase(),
              bold: true,
              size: 24, // 12pt
              color: "0F172A",
              font: "Calibri",
            }),
          ],
        })
      );
      continue;
    }

    // Bullet point line
    const isBullet = /^[•*\-–—]\s*/.test(line);
    if (isBullet) {
      const cleanBulletText = line.replace(/^[•*\-–—]\s*/, "");
      paragraphs.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 80, line: 260 },
          children: [
            new TextRun({
              text: cleanBulletText,
              size: 21, // 10.5pt
              color: "334155",
              font: "Calibri",
            }),
          ],
        })
      );
      continue;
    }

    // Sub-header / Role Title line (e.g. "Senior Software Engineer | Google | 2021 - Present")
    const isRoleOrCompany = /\||–|-|\d{4}/.test(line) && line.length < 90;
    if (isRoleOrCompany) {
      paragraphs.push(
        new Paragraph({
          spacing: { before: 100, after: 60 },
          children: [
            new TextRun({
              text: line,
              bold: true,
              size: 22, // 11pt
              color: "1E293B",
              font: "Calibri",
            }),
          ],
        })
      );
      continue;
    }

    // Standard body text / paragraph
    paragraphs.push(
      new Paragraph({
        spacing: { after: 80, line: 260 },
        children: [
          new TextRun({
            text: line,
            size: 21, // 10.5pt
            color: "334155",
            font: "Calibri",
          }),
        ],
      })
    );
  }

  // Construct Document with standard 1-inch margins
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch = 1440 dxa
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: paragraphs,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
