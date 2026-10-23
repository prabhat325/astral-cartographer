import http from "node:http";
import path from "node:path";
import { analyzeRepository, analyzeFiles } from "./index.js";

const PORT = process.env.PORT || 5050;

const server = http.createServer(async (req, res) => {
  // Set CORS headers so Person 1 (Frontend) or Person 2 (Backend) can connect smoothly
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", service: "code-analyzer-engine" }));
    return;
  }

  // Main Analyze endpoint: POST /analyze
  if (req.method === "POST" && req.url === "/analyze") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const payload = JSON.parse(body || "{}");
        let result;

        if (Array.isArray(payload.files) && payload.files.length > 0) {
          // In-memory mode (Person 2 sends files directly via HTTP)
          result = await analyzeFiles(payload.files);
        } else if (payload.repoPath) {
          // Folder path mode (Person 2 sends local cloned directory path)
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

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not Found. Use POST /analyze or GET /health" }));
});

server.listen(PORT, () => {
  console.log(`🚀 Code Analyzer Engine running on http://localhost:${PORT}`);
  console.log(`   POST http://localhost:${PORT}/analyze`);
  console.log(`   GET  http://localhost:${PORT}/health`);
});
