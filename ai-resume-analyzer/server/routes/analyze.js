import { Router } from "express";
import multer from "multer";
import path from "node:path";
import { extractResumeText } from "../services/pdfParser.js";
import { analyzeResume } from "../services/llm.js";

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
      cb(new Error("Invalid file type. Only PDF and TXT files are accepted."));
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

    const resumeText = await extractResumeText(file.buffer, file.mimetype);
    const truncatedResume = resumeText.slice(0, 3000); // Add this line

    if (resumeText.length < 50) {
      return res.status(422).json({
        error:
          "Couldn't extract meaningful text from the resume. Try a text-based PDF (not a scanned image).",
      });
    }
    const result = await analyzeResume(truncatedResume, jobDescription);
    return res.json(result);
  } catch (err) {
    console.error("Analyze error:", err);
    return res.status(500).json({ error: "Analysis failed. Please try again." });
  }
});

export default router;
