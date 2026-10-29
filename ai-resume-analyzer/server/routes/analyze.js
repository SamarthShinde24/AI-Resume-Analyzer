import { Router } from "express";
import multer from "multer";
import path from "node:path";
import { extractResumeText } from "../services/pdfParser.js";
import {
  analyzeResume,
  tailorResume,
  generateInterviewQuestions,
  generateCoverLetter,
} from "../services/llm.js";
import { computeSemanticSimilarity } from "../services/semanticEngine.js";
import { detectAtsTraps } from "../services/atsTrapDetector.js";
import { scrapeJobPosting } from "../services/jobScraper.js";
import { generateTailoredDocx, applyBulletRewrites } from "../services/documentGenerator.js";

const router = Router();

// Configure secure multer memory storage with strict 5MB limit and MIME validation
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
]);

const ALLOWED_EXTENSIONS = new Set([".pdf", ".txt", ".docx", ".doc"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const isAllowedExt = ALLOWED_EXTENSIONS.has(ext);
    const isAllowedMime = ALLOWED_MIME_TYPES.has(file.mimetype);

    if (isAllowedExt || isAllowedMime) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF, DOCX, and TXT files are accepted."));
    }
  },
});

// Middleware to gracefully handle multer errors (e.g. file size exceeded, invalid type)
const uploadMiddleware = (req, res, next) => {
  upload.single("resume")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "File too large. Maximum allowed size is 5MB." });
      }
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

const batchUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 15,
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const isAllowedExt = ALLOWED_EXTENSIONS.has(ext);
    const isAllowedMime = ALLOWED_MIME_TYPES.has(file.mimetype);

    if (isAllowedExt || isAllowedMime) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file "${file.originalname}". Only PDF, DOCX, and TXT files are accepted.`));
    }
  },
});

const batchUploadMiddleware = (req, res, next) => {
  batchUpload.array("resumes", 15)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "One or more files exceed the 5MB size limit." });
      }
      if (err.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({ error: "Maximum 15 resumes can be screened in a single batch." });
      }
      return res.status(400).json({ error: `Batch upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

router.post("/analyze", uploadMiddleware, async (req, res) => {
  try {
    const { jobDescription } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No resume file uploaded." });
    }
    if (!jobDescription || jobDescription.trim().length < 20) {
      return res
        .status(400)
        .json({ error: "Job description is missing or too short." });
    }

    const resumeText = await extractResumeText(file.buffer, file.mimetype, file.originalname);

    if (!resumeText || resumeText.length < 50) {
      return res.status(422).json({
        error:
          "Couldn't extract meaningful text from the resume. Please ensure the document is a readable PDF, DOCX, or text file (not a scanned image).",
      });
    }

    // Pass the full resume content (up to 30,000 characters ~ 6 pages) to prevent truncating skills and experience
    const MAX_RESUME_CHARS = 30000;
    const fullResumeText =
      resumeText.length > MAX_RESUME_CHARS
        ? resumeText.slice(0, MAX_RESUME_CHARS)
        : resumeText;

    const result = await analyzeResume(fullResumeText, jobDescription.trim());
    const semanticAnalysis = computeSemanticSimilarity(fullResumeText, jobDescription.trim());
    const atsTraps = detectAtsTraps(fullResumeText);

    const hybridScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(0.65 * (result.match_score || 50) + 0.35 * (semanticAnalysis.score || 50))
      )
    );

    return res.json({
      ...result,
      resume_text: fullResumeText,
      hybrid_score: hybridScore,
      semantic_analysis: semanticAnalysis,
      ats_traps: atsTraps,
    });
  } catch (err) {
    console.error("Analyze error:", err);
    return res.status(500).json({ error: err.message || "Analysis failed. Please try again." });
  }
});

router.post("/tailor", uploadMiddleware, async (req, res) => {
  try {
    const { jobDescription } = req.body;
    let { resumeText } = req.body;
    const file = req.file;

    if (file) {
      resumeText = await extractResumeText(file.buffer, file.mimetype, file.originalname);
    }

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({
        error: "Resume content is missing or too short to tailor. Please provide resume text or upload a document.",
      });
    }

    if (!jobDescription || jobDescription.trim().length < 20) {
      return res.status(400).json({
        error: "Job description is missing or too short (minimum 20 characters required).",
      });
    }

    const MAX_RESUME_CHARS = 30000;
    const safeResumeText =
      resumeText.length > MAX_RESUME_CHARS
        ? resumeText.slice(0, MAX_RESUME_CHARS)
        : resumeText;

    const result = await tailorResume(safeResumeText, jobDescription.trim());
    return res.json(result);
  } catch (err) {
    console.error("Tailor error:", err);
    return res.status(500).json({
      error: err.message || "Failed to generate tailored resume content. Please try again.",
    });
  }
});

router.post("/interview-prep", uploadMiddleware, async (req, res) => {
  try {
    const { jobDescription } = req.body;
    let { resumeText } = req.body;
    const file = req.file;

    if (file) {
      resumeText = await extractResumeText(file.buffer, file.mimetype, file.originalname);
    }

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({
        error: "Resume content is missing or too short. Please provide resume text or upload a document.",
      });
    }

    if (!jobDescription || jobDescription.trim().length < 20) {
      return res.status(400).json({
        error: "Job description is missing or too short (minimum 20 characters required).",
      });
    }

    const MAX_RESUME_CHARS = 30000;
    const safeResumeText =
      resumeText.length > MAX_RESUME_CHARS
        ? resumeText.slice(0, MAX_RESUME_CHARS)
        : resumeText;

    const result = await generateInterviewQuestions(safeResumeText, jobDescription.trim());
    return res.json(result);
  } catch (err) {
    console.error("Interview prep error:", err);
    return res.status(500).json({
      error: err.message || "Failed to generate interview prep questions. Please try again.",
    });
  }
});

router.post("/cover-letter", uploadMiddleware, async (req, res) => {
  try {
    const { jobDescription } = req.body;
    let { resumeText } = req.body;
    const file = req.file;

    if (file) {
      resumeText = await extractResumeText(file.buffer, file.mimetype, file.originalname);
    }

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({
        error: "Resume content is missing or too short. Please provide resume text or upload a document.",
      });
    }

    if (!jobDescription || jobDescription.trim().length < 20) {
      return res.status(400).json({
        error: "Job description is missing or too short (minimum 20 characters required).",
      });
    }

    const MAX_RESUME_CHARS = 30000;
    const safeResumeText =
      resumeText.length > MAX_RESUME_CHARS
        ? resumeText.slice(0, MAX_RESUME_CHARS)
        : resumeText;

    const result = await generateCoverLetter(safeResumeText, jobDescription.trim());
    return res.json(result);
  } catch (err) {
    console.error("Cover letter error:", err);
    return res.status(500).json({
      error: err.message || "Failed to generate tailored cover letter. Please try again.",
    });
  }
});

router.post("/scrape-job", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== "string" || url.trim().length === 0) {
      return res.status(400).json({ error: "Job posting URL is required." });
    }

    const scraped = await scrapeJobPosting(url.trim());
    return res.json(scraped);
  } catch (err) {
    console.error("Scrape job error:", err);
    const isClientError =
      err.message.includes("Invalid URL") ||
      err.message.includes("Could not extract") ||
      err.message.includes("HTTP and HTTPS");
    return res.status(isClientError ? 422 : 500).json({
      error: err.message || "Failed to scrape job description from the provided URL.",
    });
  }
});

router.post("/export-docx", async (req, res) => {
  try {
    const { resumeText, weakBullets, candidateName, autoApplyRewrites } = req.body;
    if (!resumeText || typeof resumeText !== "string" || resumeText.trim().length < 40) {
      return res.status(400).json({ error: "Resume text is missing or too short to export." });
    }

    const buffer = await generateTailoredDocx({
      resumeText,
      weakBullets: Array.isArray(weakBullets) ? weakBullets : [],
      candidateName: typeof candidateName === "string" ? candidateName : "",
      autoApplyRewrites: autoApplyRewrites !== false,
    });

    const safeName = candidateName
      ? candidateName.replace(/[^a-zA-Z0-9_-]/g, "_")
      : "Tailored_Resume";

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}.docx"`);
    return res.send(buffer);
  } catch (err) {
    console.error("Export DOCX error:", err);
    return res.status(500).json({
      error: err.message || "Failed to generate tailored Word document.",
    });
  }
});

router.post("/rescore-live", async (req, res) => {
  try {
    const { resumeText, jobDescription, originalChecklist, baseScore } = req.body;
    if (!resumeText || typeof resumeText !== "string" || resumeText.trim().length < 20) {
      return res.status(400).json({ error: "Resume text is missing or too short." });
    }

    const jd = typeof jobDescription === "string" ? jobDescription.trim() : "";
    const checklist = Array.isArray(originalChecklist) ? originalChecklist : [];
    const initialBaseScore = Number.isFinite(Number(baseScore)) ? Number(baseScore) : 60;

    // 1. Deterministic Semantic Vector Cosine
    const semanticAnalysis =
      jd.length > 20
        ? computeSemanticSimilarity(resumeText, jd)
        : { score: initialBaseScore, vector_overlap: [], algorithm: "TF-IDF Vector Cosine" };

    // 2. ATS Trap Detector
    const atsTraps = detectAtsTraps(resumeText);

    // 3. Keyword Match Tracking
    const lowerText = resumeText.toLowerCase();
    const updatedChecklist = [];
    const newlyResolved = [];
    let matchedCount = 0;
    let missingCount = 0;

    for (const item of checklist) {
      if (!item?.skill) continue;
      const skillLower = item.skill.toLowerCase().trim();
      const escaped = skillLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const isPresent =
        new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, "i").test(lowerText) ||
        lowerText.includes(skillLower);

      const wasMissing = item.status === "missing";
      const isNowMatched = isPresent;

      if (isNowMatched && wasMissing) {
        newlyResolved.push(item.skill);
      }

      if (isNowMatched) matchedCount++;
      else missingCount++;

      updatedChecklist.push({
        ...item,
        status: isNowMatched ? "matched" : "missing",
        newly_resolved: isNowMatched && wasMissing,
      });
    }

    // 4. Compute Dynamic Live Score (Coverage 45% + Vector Cosine 35% + ATS Health 20%)
    const totalKeywords = matchedCount + missingCount;
    const keywordCoverage =
      totalKeywords > 0 ? (matchedCount / totalKeywords) * 100 : initialBaseScore;

    const liveScore = Math.min(
      100,
      Math.max(
        15,
        Math.round(
          0.45 * keywordCoverage +
            0.35 * (semanticAnalysis.score || initialBaseScore) +
            0.20 * (atsTraps.ats_health_score || 80)
        )
      )
    );

    return res.json({
      live_score: liveScore,
      previous_score: initialBaseScore,
      score_delta: liveScore - initialBaseScore,
      semantic_analysis: semanticAnalysis,
      ats_traps: atsTraps,
      checklist: updatedChecklist,
      newly_resolved: newlyResolved,
      total_matched: matchedCount,
      total_missing: missingCount,
    });
  } catch (err) {
    console.error("Rescore live error:", err);
    return res.status(500).json({ error: err.message || "Failed to re-score resume text." });
  }
});

/**
 * Extracts a readable candidate name from parsed resume text or filename.
 */
function extractCandidateName(text, fileName = "") {
  if (text) {
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    for (let i = 0; i < Math.min(lines.length, 4); i++) {
      const line = lines[i];
      if (
        line.length >= 3 &&
        line.length <= 35 &&
        !/@|\+?\d|linkedin|github|experience|summary|resume|curriculum|objective/i.test(line) &&
        /^[a-zA-Z\s.'-]+$/.test(line)
      ) {
        return line;
      }
    }
  }

  if (fileName) {
    const base = path.basename(fileName, path.extname(fileName));
    const cleaned = base
      .replace(/[-_.]*(resume|cv|application|profile|v\d+)[-_.]*/gi, " ")
      .replace(/[-_]+/g, " ")
      .trim();

    if (cleaned.length >= 2) {
      return cleaned
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
    }
  }

  return "Candidate";
}

/**
 * Formats byte size into human readable string.
 */
function formatBytes(bytes) {
  if (!bytes) return "0 KB";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

router.post("/batch-screen", batchUploadMiddleware, async (req, res) => {
  try {
    const { jobDescription } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No resumes uploaded for batch screening." });
    }

    if (!jobDescription || jobDescription.trim().length < 20) {
      return res.status(400).json({
        error: "Job description is missing or too short (minimum 20 characters required).",
      });
    }

    const cleanJd = jobDescription.trim();
    const candidateResults = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const text = await extractResumeText(file.buffer, file.mimetype, file.originalname);

        if (!text || text.trim().length < 30) {
          candidateResults.push({
            id: `cand-${i + 1}`,
            candidate_name: extractCandidateName("", file.originalname),
            file_name: file.originalname,
            file_size: formatBytes(file.size),
            score: 25,
            semantic_score: 20,
            ats_health_score: 30,
            cosine_distance: 0.1,
            matched_keywords: [],
            critical_traps_count: 1,
            warnings_count: 0,
            status: "Unparseable",
            status_badge: "bg-rose-50 text-rose-700 border-rose-200",
            summary: "Could not extract readable text from document.",
            snippet: "Document could not be parsed into text.",
          });
          continue;
        }

        const safeText = text.length > 25000 ? text.slice(0, 25000) : text;
        const candidateName = extractCandidateName(safeText, file.originalname);
        const semantic = computeSemanticSimilarity(safeText, cleanJd);
        const traps = detectAtsTraps(safeText);

        const compositeScore = Math.max(
          15,
          Math.min(
            100,
            Math.round(0.65 * (semantic.score || 50) + 0.35 * (traps.ats_health_score || 70))
          )
        );

        let status = "Needs Review";
        let statusBadge = "bg-rose-50 text-rose-700 border-rose-200";

        if (compositeScore >= 80) {
          status = "Top Match";
          statusBadge = "bg-emerald-50 text-emerald-700 border-emerald-200";
        } else if (compositeScore >= 65) {
          status = "Qualified";
          statusBadge = "bg-indigo-50 text-indigo-700 border-indigo-200";
        } else if (compositeScore >= 50) {
          status = "Moderate Fit";
          statusBadge = "bg-amber-50 text-amber-700 border-amber-200";
        }

        candidateResults.push({
          id: `cand-${i + 1}`,
          candidate_name: candidateName,
          file_name: file.originalname,
          file_size: formatBytes(file.size),
          score: compositeScore,
          semantic_score: semantic.score,
          ats_health_score: traps.ats_health_score,
          cosine_distance: semantic.raw_cosine,
          matched_keywords: semantic.vector_overlap || [],
          critical_traps_count: traps.traps.filter((t) => t.severity === "critical").length,
          warnings_count: traps.traps.filter((t) => t.severity === "warning").length,
          status,
          status_badge: statusBadge,
          snippet: safeText.slice(0, 220).replace(/\s+/g, " ") + "...",
        });
      } catch (fileErr) {
        console.warn(`Error screening file ${file.originalname}:`, fileErr.message);
        candidateResults.push({
          id: `cand-${i + 1}`,
          candidate_name: extractCandidateName("", file.originalname),
          file_name: file.originalname,
          file_size: formatBytes(file.size),
          score: 20,
          semantic_score: 15,
          ats_health_score: 25,
          cosine_distance: 0.05,
          matched_keywords: [],
          critical_traps_count: 1,
          warnings_count: 0,
          status: "Error",
          status_badge: "bg-rose-50 text-rose-700 border-rose-200",
          snippet: `File processing error: ${fileErr.message}`,
        });
      }
    }

    // Sort leaderboard descending by score
    candidateResults.sort((a, b) => b.score - a.score);

    // Assign 1-indexed ranks
    candidateResults.forEach((c, idx) => {
      c.rank = idx + 1;
    });

    const totalScreened = candidateResults.length;
    const avgScore =
      totalScreened > 0
        ? Math.round(candidateResults.reduce((acc, c) => acc + c.score, 0) / totalScreened)
        : 0;
    const topCandidate = candidateResults[0]?.candidate_name || "N/A";
    const topScore = candidateResults[0]?.score || 0;
    const qualifiedCount = candidateResults.filter((c) => c.score >= 65).length;

    return res.json({
      summary: {
        total_screened: totalScreened,
        average_score: avgScore,
        top_score: topScore,
        top_candidate: topCandidate,
        qualified_count: qualifiedCount,
      },
      leaderboard: candidateResults,
    });
  } catch (err) {
    console.error("Batch screening error:", err);
    return res.status(500).json({
      error: err.message || "Failed to process batch resume screening.",
    });
  }
});

export default router;
