import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import analyzeRoute from "./routes/analyze.js";

dotenv.config({ path: new URL('.env', import.meta.url).pathname.slice(1) });

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", analyzeRoute);

app.get("/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
