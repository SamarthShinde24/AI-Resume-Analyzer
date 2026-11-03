import { Router } from "express";
import { dbRepository } from "../services/db.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

// Protect all /api/user endpoints
router.use(requireAuth);

// --- Resume Analysis History Sync ---

// GET /api/user/history
router.get("/history", (req, res) => {
  try {
    const history = dbRepository.getUserHistory(req.user.id);
    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user analysis history." });
  }
});

// POST /api/user/history
router.post("/history", (req, res) => {
  try {
    const { fileName, roleTitle, matchScore, jobDescription, resultJson, createdAt } = req.body;
    if (!resultJson) {
      return res.status(400).json({ error: "Analysis result payload is required." });
    }

    const recordId = dbRepository.saveHistory(req.user.id, {
      fileName,
      roleTitle,
      matchScore,
      jobDescription,
      resultJson,
      createdAt,
    });

    res.status(201).json({
      message: "Analysis snapshot saved to cloud database.",
      id: recordId,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to save analysis history snapshot." });
  }
});

// DELETE /api/user/history/:id
router.delete("/history/:id", (req, res) => {
  try {
    const deleted = dbRepository.deleteHistory(req.user.id, req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Record not found." });
    }
    res.json({ message: "History record deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete history record." });
  }
});

// --- Kanban Pipeline Applications Sync ---

// GET /api/user/kanban
router.get("/kanban", (req, res) => {
  try {
    const jobs = dbRepository.getUserKanban(req.user.id);
    res.json({ jobs });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user application pipeline." });
  }
});

// POST /api/user/kanban
router.post("/kanban", (req, res) => {
  try {
    const jobData = req.body;
    if (!jobData.company || !jobData.role) {
      return res.status(400).json({ error: "Company and Role are required." });
    }

    const jobId = dbRepository.saveKanbanJob(req.user.id, jobData);
    res.status(201).json({
      message: "Application saved to cloud pipeline.",
      id: jobId,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to save kanban application." });
  }
});

// PATCH /api/user/kanban/:id/stage
router.patch("/kanban/:id/stage", (req, res) => {
  try {
    const { stage } = req.body;
    if (!stage) {
      return res.status(400).json({ error: "New stage is required." });
    }

    const updated = dbRepository.updateKanbanStage(req.user.id, req.params.id, stage);
    if (!updated) {
      return res.status(404).json({ error: "Application record not found." });
    }

    res.json({ message: "Application stage updated." });
  } catch (err) {
    res.status(500).json({ error: "Failed to update kanban stage." });
  }
});

// DELETE /api/user/kanban/:id
router.delete("/kanban/:id", (req, res) => {
  try {
    const deleted = dbRepository.deleteKanbanJob(req.user.id, req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Application record not found." });
    }
    res.json({ message: "Application removed from pipeline." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete application." });
  }
});

// --- Full Local-to-Cloud Database Migration Sync ---

// POST /api/user/sync-local
router.post("/sync-local", (req, res) => {
  try {
    const { history = [], kanban = [] } = req.body;
    const result = dbRepository.bulkSync(req.user.id, { history, kanban });
    res.json({
      message: "Local data synced to cloud SQLite database successfully.",
      synced: result,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to migrate local data to cloud database." });
  }
});

export default router;
