import http from "node:http";
import path from "node:path";
import { analyzeRepository, analyzeFiles, ArchitecturalAIExpert } from "./index.js";

const PORT = process.env.PORT || 5050;
const aiExpert = new ArchitecturalAIExpert();

const server = http.createServer(async (req, res) => {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = req.url.split("?")[0];

  // Health check endpoint
  if (req.method === "GET" && (url === "/health" || url === "/api/health")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", service: "code-analyzer-engine", port: PORT }));
    return;
  }

  // Analyze endpoint: POST /analyze or POST /api/analyze
  if (req.method === "POST" && (url === "/analyze" || url === "/api/analyze")) {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const payload = JSON.parse(body || "{}");
        let result;

        if (Array.isArray(payload.files) && payload.files.length > 0) {
          result = await analyzeFiles(payload.files);
        } else if (payload.repoPath) {
          result = await analyzeRepository(path.resolve(payload.repoPath));
        } else {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: "Invalid request payload. Provide either 'files' array or 'repoPath' string."
            })
          );
          return;
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // AI Explain endpoint: POST /ai/explain or POST /api/ai/explain
  if (req.method === "POST" && (url === "/ai/explain" || url === "/api/ai/explain")) {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const payload = JSON.parse(body || "{}");
        const { code, filePath, context } = payload;
        const explanation = aiExpert.explainCode(code, filePath, context);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, explanation, provider: "astral-analyzer-engine" }));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not Found. Available endpoints: POST /analyze, POST /ai/explain, GET /health" }));
});

server.listen(PORT, () => {
  console.log(`🚀 Code Analyzer Engine running on http://localhost:${PORT}`);
  console.log(`   POST http://localhost:${PORT}/analyze`);
  console.log(`   POST http://localhost:${PORT}/ai/explain`);
  console.log(`   GET  http://localhost:${PORT}/health`);
});
