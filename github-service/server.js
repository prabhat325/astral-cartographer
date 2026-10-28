require("dotenv").config();

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { RepositoryController } = require("./RepositoryController");

const app = express();
const controller = new RepositoryController();

// ────────────────────────────────────────────────────────────────
// Middleware
// ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Express-level rate limiter: max 30 analysis requests per 15 min per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests. Please wait 15 minutes." }
});

// ────────────────────────────────────────────────────────────────
// Routes
// ────────────────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({ message: "The Astral Cartographer Backend Service is running" });
});

// Health Check
app.get("/health", (req, res) => controller.handleHealth(req, res));

// Analysis Endpoints
app.post("/analyze", apiLimiter, (req, res) => controller.handleAnalyze(req, res));
app.post("/api/analyze", apiLimiter, (req, res) => controller.handleAnalyze(req, res));

// AI Explanation Endpoints
app.post("/ai/explain", (req, res) => controller.handleAiExplain(req, res));
app.post("/api/ai/explain", (req, res) => controller.handleAiExplain(req, res));

// Cache Management Endpoints
app.delete("/cache", (req, res) => controller.handleClearCache(req, res));
app.get("/cache/stats", (req, res) => controller.handleCacheStats(req, res));

// ────────────────────────────────────────────────────────────────
// Start Server
// ────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀  The Astral Cartographer Backend running on http://localhost:${PORT}`);
  console.log(`   Architecture: RepositoryController & GitHubService`);
  console.log(`   Cache: ✅ in-memory (TTL 30 min)`);
  console.log(`   Rate limit: 30 requests / 15 min / IP\n`);
});

module.exports = app;
