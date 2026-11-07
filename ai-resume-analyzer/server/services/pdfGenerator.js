/**
 * Server-Side Binary PDF Generator (pdfkit)
 *
 * Generates ATS-compliant tailored resumes and executive ATS audit sheets
 * as binary PDF buffers directly on the server without browser print dependencies.
 */

import PDFDocument from "pdfkit";
import { applyBulletRewrites } from "./documentGenerator.js";

/**
 * Converts a PDFKit stream to a Promise resolving to a binary Buffer.
 *
 * @param {PDFKit.PDFDocument} doc
 * @returns {Promise<Buffer>}
 */
export function streamToBuffer(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", (err) => reject(err));
  });
}

/**
 * Checks if a string is a standard resume section heading.
 */
function isSectionHeading(line) {
  const clean = line.replace(/[:\-_#*]/g, "").trim().toUpperCase();
  const knownHeadings = [
    "SUMMARY",
    "PROFESSIONAL SUMMARY",
    "EXECUTIVE SUMMARY",
    "EXPERIENCE",
    "WORK EXPERIENCE",
    "PROFESSIONAL EXPERIENCE",
    "EMPLOYMENT HISTORY",
    "SKILLS",
    "TECHNICAL SKILLS",
    "CORE COMPETENCIES",
    "AREAS OF EXPERTISE",
    "EDUCATION",
    "ACADEMIC BACKGROUND",
    "PROJECTS",
    "KEY PROJECTS",
    "CERTIFICATIONS",
    "LICENSES & CERTIFICATIONS",
    "PUBLICATIONS",
    "AWARDS",
    "VOLUNTEER EXPERIENCE",
  ];
  return knownHeadings.includes(clean);
}

/**
 * Renders page numbers across all buffered pages in the PDF document.
 */
function addPageNumbers(doc, footerText = "AI Resume & ATS Analyzer") {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const oldFill = doc.fillColor();
    doc
      .fillColor("#94a3b8")
      .fontSize(8)
      .font("Helvetica")
      .text(
        `${footerText}  •  Page ${i + 1} of ${range.count}`,
        doc.page.margins.left,
        doc.page.height - 30,
        {
          width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
          align: "center",
        }
      );
    doc.fillColor(oldFill);
  }
}

/**
 * Generates an executive, ATS-compliant Tailored Resume as a binary PDF buffer.
 *
 * @param {object} options
 * @param {string} options.resumeText - Raw or parsed resume text.
 * @param {Array<{original: string, rewrite: string}>} [options.weakBullets] - Bullets to replace.
 * @param {string} [options.candidateName] - Candidate's full name.
 * @param {boolean} [options.autoApplyRewrites=true] - Whether to apply bullet replacements.
 * @returns {Promise<Buffer>}
 */
export async function generateTailoredPdf({
  resumeText = "",
  weakBullets = [],
  candidateName = "",
  autoApplyRewrites = true,
}) {
  if (!resumeText || typeof resumeText !== "string" || resumeText.trim().length === 0) {
    throw new Error("Resume text is required to generate tailored PDF.");
  }

  // 1. Apply AI rewrites if requested
  let textToRender = resumeText;
  if (autoApplyRewrites !== false && Array.isArray(weakBullets) && weakBullets.length > 0) {
    const rewritten = applyBulletRewrites(resumeText, weakBullets);
    textToRender = rewritten.updatedText;
  }

  // 2. Initialize PDFKit Document with standard letter size and ATS margins (40pt)
  const doc = new PDFDocument({
    size: "LETTER",
    margins: { top: 40, bottom: 45, left: 45, right: 45 },
    bufferPages: true,
    info: {
      Title: `${candidateName || "Candidate"} - Tailored Resume`,
      Author: "AI Resume & ATS Analyzer",
      Subject: "ATS-Compliant Tailored Professional Resume",
      Keywords: "Resume, ATS, Tailored, AI Rewrites",
    },
  });

  const bufferPromise = streamToBuffer(doc);
  const printableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  const rawLines = textToRender.split("\n");

  // 3. Extract Candidate Name and Contact Details from top lines
  let inferredName = candidateName?.trim() || "";
  let contactLines = [];
  let lineCursor = 0;

  for (let i = 0; i < Math.min(rawLines.length, 6); i++) {
    const line = rawLines[i].trim();
    if (!line) continue;

    if (!inferredName && !isSectionHeading(line)) {
      inferredName = line;
      lineCursor = i + 1;
      continue;
    }

    if (
      inferredName &&
      !isSectionHeading(line) &&
      (line.includes("@") ||
        line.includes("linkedin.com") ||
        line.includes("github.com") ||
        line.includes("|") ||
        /\d{3}[-\s.]?\d{3}[-\s.]?\d{4}/.test(line))
    ) {
      contactLines.push(line);
      lineCursor = i + 1;
    } else {
      break;
    }
  }

  // Fallback candidate name if top line looked like a heading
  if (!inferredName) {
    inferredName = "Candidate Profile";
  }

  // Render Header (Name + Contact Details)
  doc
    .font("Helvetica-Bold")
    .fontSize(19)
    .fillColor("#0f172a")
    .text(inferredName, { align: "center" });

  if (contactLines.length > 0) {
    doc.moveDown(0.3);
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#475569")
      .text(contactLines.join("  •  "), { align: "center" });
  }

  doc.moveDown(0.6);
  doc
    .strokeColor("#cbd5e1")
    .lineWidth(0.75)
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.margins.left + printableWidth, doc.y)
    .stroke();
  doc.moveDown(0.8);

  // 4. Render Body Sections & Bullets
  for (let i = lineCursor; i < rawLines.length; i++) {
    const rawLine = rawLines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      doc.moveDown(0.25);
      continue;
    }

    // Check if line is a Section Heading
    if (isSectionHeading(trimmed)) {
      doc.moveDown(0.6);

      // Avoid orphaned headings at the bottom of the page
      if (doc.y > doc.page.height - 100) {
        doc.addPage();
      }

      const headingText = trimmed.toUpperCase().replace(/[:#*]/g, "").trim();
      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor("#1e293b")
        .text(headingText, { characterSpacing: 0.5 });

      doc
        .strokeColor("#e2e8f0")
        .lineWidth(0.5)
        .moveTo(doc.page.margins.left, doc.y + 2)
        .lineTo(doc.page.margins.left + printableWidth, doc.y + 2)
        .stroke();

      doc.moveDown(0.4);
      continue;
    }

    // Check if line is a Bullet Point
    const isBullet = /^[\s•*\-\u2022\u2023\u25E6]/.test(rawLine) || /^(\d+\.)\s+/.test(trimmed);

    if (isBullet) {
      const cleanBullet = trimmed.replace(/^[\s•*\-\u2022\u2023\u25E6\d.)]+/, "").trim();
      if (!cleanBullet) continue;

      const bulletIndent = 14;
      const bulletY = doc.y;

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#64748b")
        .text("•", doc.page.margins.left + 2, bulletY, {
          width: bulletIndent,
          lineBreak: false,
        });

      doc
        .font("Helvetica")
        .fontSize(9.5)
        .fillColor("#334155")
        .text(cleanBullet, doc.page.margins.left + bulletIndent, bulletY, {
          width: printableWidth - bulletIndent,
          align: "left",
          lineGap: 2.2,
        });

      doc.moveDown(0.25);
      continue;
    }

    // Check if line looks like Job Title / Company / Date
    const isJobHeader =
      trimmed.includes("|") ||
      /\b(19\d{2}|20\d{2})\b/.test(trimmed) ||
      /\b(Present|Current)\b/i.test(trimmed);

    if (isJobHeader && trimmed.length < 120) {
      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor("#0f172a")
        .text(trimmed, {
          width: printableWidth,
          lineGap: 2,
        });
      doc.moveDown(0.2);
      continue;
    }

    // Regular Paragraph / Summary Text
    doc
      .font("Helvetica")
      .fontSize(9.5)
      .fillColor("#334155")
      .text(trimmed, {
        width: printableWidth,
        align: "left",
        lineGap: 2.5,
      });

    doc.moveDown(0.25);
  }

  // 5. Add Page Numbers across all generated pages
  addPageNumbers(doc, `${inferredName}  •  Tailored Resume`);

  doc.end();
  return bufferPromise;
}

/**
 * Generates an executive, recruiter-grade ATS Audit Sheet as a binary PDF buffer.
 *
 * @param {object} options
 * @param {object} options.result - Complete ATS analysis payload from analyze API.
 * @param {object} [options.meta] - Metadata (candidateName, roleTitle, fileName, date).
 * @returns {Promise<Buffer>}
 */
export async function generateAuditSheetPdf({ result, meta = {} }) {
  if (!result || typeof result !== "object") {
    throw new Error("Audit result object is required to generate audit sheet PDF.");
  }

  const doc = new PDFDocument({
    size: "LETTER",
    margins: { top: 40, bottom: 45, left: 45, right: 45 },
    bufferPages: true,
    info: {
      Title: `ATS Audit Sheet - ${meta.roleTitle || "Target Role"}`,
      Author: "AI Resume & ATS Analyzer",
      Subject: "Executive ATS Compliance and Match Score Audit Sheet",
    },
  });

  const bufferPromise = streamToBuffer(doc);
  const printableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  const score = Number.isFinite(result.match_score) ? result.match_score : 75;
  const breakdown = result.score_breakdown || {
    skills_match: score,
    experience_fit: score,
    quantifiable_impact: Math.max(30, score - 10),
    ats_readability: 85,
  };

  const roleTitle = meta.roleTitle || "Target Role Analysis";
  const fileName = meta.fileName || "Candidate_Resume.pdf";
  const candidateName = meta.candidateName || "Candidate";
  const dateStr = meta.date || new Date().toISOString().slice(0, 10);

  // Determine score tier
  let scoreTier = "Moderate Fit";
  let tierColor = "#d97706"; // amber
  if (score >= 85) {
    scoreTier = "Exceptional Match";
    tierColor = "#059669"; // emerald
  } else if (score >= 70) {
    scoreTier = "Strong Candidate";
    tierColor = "#4f46e5"; // indigo
  } else if (score < 50) {
    scoreTier = "Critical Attention Required";
    tierColor = "#dc2626"; // rose
  }

  // --- HEADER BANNER ---
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor("#4f46e5")
    .text("COMPREHENSIVE ATS COMPLIANCE AUDIT", { characterSpacing: 1 });

  doc
    .font("Helvetica-Bold")
    .fontSize(20)
    .fillColor("#0f172a")
    .text(roleTitle);

  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor("#64748b")
    .text(`Target File: ${fileName}  |  Candidate: ${candidateName}  |  Generated: ${dateStr}`);

  doc.moveDown(0.6);
  doc
    .strokeColor("#cbd5e1")
    .lineWidth(0.75)
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.margins.left + printableWidth, doc.y)
    .stroke();
  doc.moveDown(0.8);

  // --- OVERALL MATCH SCORE CARD ---
  const cardY = doc.y;
  const cardHeight = 65;

  // Background Box
  doc
    .roundedRect(doc.page.margins.left, cardY, printableWidth, cardHeight, 8)
    .fillAndStroke("#f8fafc", "#e2e8f0");

  // Score Badge Box (Left)
  doc
    .roundedRect(doc.page.margins.left + 12, cardY + 10, 85, 45, 6)
    .fillAndStroke("#ffffff", tierColor);

  doc
    .font("Helvetica-Bold")
    .fontSize(22)
    .fillColor(tierColor)
    .text(`${score}%`, doc.page.margins.left + 12, cardY + 16, {
      width: 85,
      align: "center",
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .fillColor("#64748b")
    .text("OVERALL MATCH", doc.page.margins.left + 12, cardY + 41, {
      width: 85,
      align: "center",
    });

  // Summary Text (Right)
  const summaryX = doc.page.margins.left + 110;
  const summaryWidth = printableWidth - 122;

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor("#0f172a")
    .text(`Rating: ${scoreTier}`, summaryX, cardY + 12);

  const cleanSummary =
    result.summary ||
    "Strong candidate alignment with measurable technical impact and high ATS parseability.";
  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor("#475569")
    .text(cleanSummary.slice(0, 240) + (cleanSummary.length > 240 ? "..." : ""), summaryX, cardY + 28, {
      width: summaryWidth,
      lineGap: 1.5,
    });

  doc.y = cardY + cardHeight + 14;

  // --- MULTI-DIMENSIONAL SCORE BREAKDOWN ---
  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor("#0f172a")
    .text("Scoring Methodology & Criteria Weights");
  doc.moveDown(0.4);

  const dimensions = [
    {
      name: "Hard Skills Alignment",
      weight: "35%",
      score: breakdown.skills_match,
      desc: "Exact technical keyword overlap and direct capability matching.",
    },
    {
      name: "Experience & Seniority Fit",
      weight: "25%",
      score: breakdown.experience_fit,
      desc: "Years of experience, leadership scope, and seniority level match.",
    },
    {
      name: "Quantifiable Impact",
      weight: "25%",
      score: breakdown.quantifiable_impact,
      desc: "Presence of metrics, percentages, dollar scale, and outcomes in bullets.",
    },
    {
      name: "ATS Formatting & Readability",
      weight: "15%",
      score: breakdown.ats_readability,
      desc: "Standard heading terminology, clean typography, and parser compliance.",
    },
  ];

  const colWidth = (printableWidth - 15) / 4;
  const tableY = doc.y;

  dimensions.forEach((dim, idx) => {
    const boxX = doc.page.margins.left + idx * (colWidth + 5);
    doc
      .roundedRect(boxX, tableY, colWidth, 68, 6)
      .fillAndStroke("#ffffff", "#e2e8f0");

    doc
      .font("Helvetica-Bold")
      .fontSize(15)
      .fillColor("#4f46e5")
      .text(`${dim.score}%`, boxX, tableY + 8, { width: colWidth, align: "center" });

    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor("#0f172a")
      .text(dim.name, boxX + 4, tableY + 28, { width: colWidth - 8, align: "center" });

    doc
      .font("Helvetica")
      .fontSize(7)
      .fillColor("#64748b")
      .text(`Weight: ${dim.weight}`, boxX, tableY + 44, { width: colWidth, align: "center" });
  });

  doc.y = tableY + 76;

  // --- KEYWORD GAPS & PLACEMENT CHECKLIST ---
  doc.moveDown(0.4);
  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor("#0f172a")
    .text("Keyword Gap Checklist & Placement Recommendations");
  doc.moveDown(0.3);

  const matchedSkills = Array.isArray(result.matched_skills) ? result.matched_skills : [];
  const missingSkills = Array.isArray(result.missing_skills) ? result.missing_skills : [];
  const checklist = Array.isArray(result.keyword_checklist) ? result.keyword_checklist : [];

  if (matchedSkills.length > 0) {
    doc
      .font("Helvetica-Bold")
      .fontSize(8.5)
      .fillColor("#059669")
      .text(`Matched Keywords (${matchedSkills.length}): `)
      .font("Helvetica")
      .fillColor("#334155")
      .text(matchedSkills.join(", "), { lineGap: 1.5 });
    doc.moveDown(0.3);
  }

  if (missingSkills.length > 0) {
    doc
      .font("Helvetica-Bold")
      .fontSize(8.5)
      .fillColor("#dc2626")
      .text(`Missing Keywords (${missingSkills.length}): `)
      .font("Helvetica")
      .fillColor("#334155")
      .text(missingSkills.join(", "), { lineGap: 1.5 });
    doc.moveDown(0.4);
  }

  // Placement tips sample from checklist
  if (checklist.length > 0) {
    const missingItems = checklist.filter((c) => c.status === "missing").slice(0, 4);
    if (missingItems.length > 0) {
      missingItems.forEach((item) => {
        const itemY = doc.y;
        doc
          .font("Helvetica-Bold")
          .fontSize(8)
          .fillColor("#d97706")
          .text(`[GAP] ${item.skill} (${item.type || "required"}):`, doc.page.margins.left + 5, itemY, {
            width: 140,
            lineBreak: false,
          });

        doc
          .font("Helvetica")
          .fontSize(8)
          .fillColor("#475569")
          .text(item.tip || "Integrate naturally into experience bullet points with quantified results.", doc.page.margins.left + 150, itemY, {
            width: printableWidth - 155,
            lineGap: 1.5,
          });

        doc.moveDown(0.2);
      });
    }
  }

  doc.moveDown(0.5);

  // --- WEAK BULLETS & AI REWRITES SECTION ---
  const weakBullets = Array.isArray(result.weak_bullets) ? result.weak_bullets : [];
  if (weakBullets.length > 0) {
    // Check if new page needed
    if (doc.y > doc.page.height - 180) {
      doc.addPage();
    }

    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor("#0f172a")
      .text(`Quantified Bullet Optimization Matrix (${weakBullets.length} Identified)`);
    doc.moveDown(0.4);

    weakBullets.slice(0, 4).forEach((bullet, idx) => {
      if (doc.y > doc.page.height - 110) {
        doc.addPage();
      }

      const boxY = doc.y;
      const boxHeight = 52;

      doc
        .roundedRect(doc.page.margins.left, boxY, printableWidth, boxHeight, 6)
        .fillAndStroke("#ffffff", "#e2e8f0");

      doc
        .font("Helvetica-Bold")
        .fontSize(7.5)
        .fillColor("#dc2626")
        .text(`BEFORE (Weak Bullet #${idx + 1}):`, doc.page.margins.left + 8, boxY + 6);

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#64748b")
        .text(bullet.original || "", doc.page.margins.left + 8, boxY + 16, {
          width: printableWidth - 16,
          lineBreak: true,
          height: 12,
          ellipsis: true,
        });

      doc
        .font("Helvetica-Bold")
        .fontSize(7.5)
        .fillColor("#059669")
        .text("AI-OPTIMIZED REWRITE:", doc.page.margins.left + 8, boxY + 28);

      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor("#0f172a")
        .text(bullet.rewrite || "", doc.page.margins.left + 8, boxY + 38, {
          width: printableWidth - 16,
          lineBreak: true,
          height: 12,
          ellipsis: true,
        });

      doc.y = boxY + boxHeight + 6;
    });
  }

  // Add Page Numbers
  addPageNumbers(doc, `ATS Audit Sheet  •  ${meta.roleTitle || "Target Role"}`);

  doc.end();
  return bufferPromise;
}
