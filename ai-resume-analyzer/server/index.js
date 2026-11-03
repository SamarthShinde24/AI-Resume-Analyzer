import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import analyzeRoute from "./routes/analyze.js";
import authRoute from "./routes/auth.js";
import userSyncRoute from "./routes/userSync.js";
import { dbRepository } from "./services/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env reliably across all operating systems (Windows, Linux, macOS)
const envPath = path.resolve(__dirname, ".env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", analyzeRoute);
app.use("/api/auth", authRoute);
app.use("/api/user", userSyncRoute);

app.get("/health", (req, res) => {
  const dbStats = dbRepository.getStats();
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    database: {
      connected: true,
      users: dbStats.userCount,
      history: dbStats.historyCount,
      kanban: dbStats.kanbanCount,
    },
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
