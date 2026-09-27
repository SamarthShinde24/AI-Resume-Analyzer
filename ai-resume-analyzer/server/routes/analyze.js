import { Router } from "express";
import multer from "multer";
import { extractResumeText } from "../services/pdfParser.js";
import { analyzeResume } from "../services/llm.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/analyze", upload.single("resume"), async (req, res) => {
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
