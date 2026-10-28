const NodeCache = require("node-cache");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GitHubService } = require("./GitHubService");
const { analyzeFiles, ArchitecturalAIExpert } = require("../analyzer");

/**
 * RepositoryController — Handles user requests, validates input, coordinates
 * caching, invokes GitHubService and AST analysis, and manages AI explanation.
 */
class RepositoryController {
  constructor() {
    this.githubService = new GitHubService();
    this.analysisCache = new NodeCache({ stdTTL: 1800, checkperiod: 300 });
    this.aiExpert = new ArchitecturalAIExpert();
    this.gemini = process.env.GEMINI_API_KEY
      ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
      : null;
  }

  /**
   * Primary repository analysis request handler.
   */
  async handleAnalyze(req, res) {
    try {
      const { repoUrl, branch } = req.body || {};

      if (!req.body || typeof req.body !== "object") {
        return res.status(400).json({ success: false, error: "Request body must be a JSON object" });
      }
      if (typeof repoUrl !== "string" || !repoUrl.trim()) {
        return res.status(400).json({ success: false, error: "A valid repoUrl is required" });
      }

      let owner, repo;
      try {
        const parsed = this.githubService.parseGitHubUrl(repoUrl);
        owner = parsed.owner;
        repo = parsed.repo;
      } catch (err) {
        return res.status(400).json({ success: false, error: err.message });
      }

      const cacheKey = `${owner}/${repo}${branch ? `@${branch}` : ""}`;

      // Cache Hit
      const cached = this.analysisCache.get(cacheKey);
      if (cached) {
        console.log(`Cache HIT: ${cacheKey}`);
        return res.json({ ...cached, fromCache: true });
      }

      console.log(`Cache MISS: ${cacheKey} — fetching from GitHub…`);

      // 1. Fetch metadata, branches, commits, languages in parallel
      const [metadata, branches, commits, languages, tree] = await Promise.all([
        this.githubService.getRepositoryMetadata(owner, repo).catch(() => ({
          name: repo,
          fullName: `${owner}/${repo}`,
          description: "Repository fetched via GitHub API",
          stars: 0,
          forks: 0,
          openIssues: 0,
          defaultBranch: "main"
        })),
        this.githubService.getBranches(owner, repo).catch(() => []),
        this.githubService.getCommits(owner, repo).catch(() => []),
        this.githubService.getLanguages(owner, repo).catch(() => ({})),
        this.githubService.getRepositoryTree(owner, repo)
      ]);

      // 2. Filter & fetch source files
      const sourceFileItems = this.githubService.filterSourceFiles(tree);
      const files = await this.githubService.getSourceFiles(owner, repo, sourceFileItems);

      // 3. Run AST & Architecture Analysis
      const architecture = analyzeFiles(files);

      const payload = {
        success: true,
        repository: {
          ...metadata,
          branches,
          commits,
          languages
        },
        totalFiles: files.length,
        files,
        architecture
      };

      // Store in Cache
      this.analysisCache.set(cacheKey, payload);
      console.log(`Cached analysis for ${cacheKey} (${files.length} files)`);

      return res.json(payload);
    } catch (error) {
      console.error("Analysis request failed:", error.message);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * AI-powered code explanation & architectural issue detection handler.
   */
  async handleAiExplain(req, res) {
    try {
      const { code, filePath, context } = req.body || {};
      if (!code || typeof code !== "string") {
        return res.status(400).json({ success: false, error: "code field is required" });
      }

      // If Gemini API is available and configured, use it
      if (this.gemini) {
        try {
          const model = this.gemini.getGenerativeModel({ model: "gemini-1.5-flash" });
          const prompt = `You are an expert software architect reviewing code for the Astral Cartographer tool.

File: ${filePath || "unknown"}
${context ? `Architectural context:
- Cluster: ${context.cluster}
- Cyclomatic Complexity: ${context.complexity}
- In-degree (dependents): ${context.inDegree}
- Out-degree (dependencies): ${context.outDegree}
- Blast Radius: ${context.blastRadius} files affected
- Is God File: ${context.isGodFile}` : ""}

Source code:
\`\`\`
${code.slice(0, 6000)}
\`\`\`

Provide a concise technical analysis in this exact format:

**Purpose**: One sentence describing what this file/module does.

**Key Responsibilities**:
- Bullet point list (max 4 items)

**Architectural Observations**:
- Note any coupling issues, complexity concerns, or design patterns detected

**Recommendations**:
- Actionable improvement suggestions (max 3)

Keep each section brief and developer-focused.`;

          const result = await model.generateContent(prompt);
          const text = result.response.text();
          return res.json({ success: true, explanation: text, provider: "gemini" });
        } catch (geminiError) {
          console.warn("Gemini call failed, falling back to built-in Architectural AI Expert:", geminiError.message);
        }
      }

      // Built-in intelligent Architectural AI Expert fallback
      const explanation = this.aiExpert.explainCode(code, filePath, context);
      return res.json({
        success: true,
        explanation,
        provider: "astral-architectural-ai"
      });
    } catch (error) {
      console.error("AI explain error:", error.message);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Clear cache.
   */
  handleClearCache(_req, res) {
    this.analysisCache.flushAll();
    res.json({ success: true, message: "Cache cleared" });
  }

  /**
   * Cache statistics.
   */
  handleCacheStats(_req, res) {
    res.json({
      keys: this.analysisCache.keys(),
      stats: this.analysisCache.getStats()
    });
  }

  /**
   * Health status.
   */
  handleHealth(_req, res) {
    res.json({
      status: "ok",
      cache: { keys: this.analysisCache.keys().length },
      ai: {
        geminiConfigured: Boolean(this.gemini),
        fallbackEngineReady: true
      }
    });
  }
}

module.exports = { RepositoryController };

