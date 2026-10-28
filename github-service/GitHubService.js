require("dotenv").config();

const { Octokit } = require("@octokit/rest");
const { throttling } = require("@octokit/plugin-throttling");
const { retry } = require("@octokit/plugin-retry");

// Build Octokit with throttling + auto-retry on 5xx / 429
const ThrottledOctokit = Octokit.plugin(throttling, retry);

/**
 * GitHubService — Communicates directly with the GitHub REST API.
 * Retrieves repository metadata, files, tree structure, branches, commits, and languages.
 */
class GitHubService {
  constructor(token = process.env.GITHUB_TOKEN) {
    this.token = token;
    this.octokit = new ThrottledOctokit({
      auth: this.token,
      throttle: {
        onRateLimit: (retryAfter, options, _octokit, retryCount) => {
          console.warn(
            `GitHub rate limit hit for ${options.method} ${options.url}. ` +
            `Retry after ${retryAfter}s (attempt ${retryCount + 1}/3)`
          );
          return retryCount < 3;
        },
        onSecondaryRateLimit: (retryAfter, options, _octokit) => {
          console.warn(
            `GitHub secondary rate limit for ${options.method} ${options.url}. ` +
            `Waiting ${retryAfter}s…`
          );
          return true;
        }
      },
      retry: {
        doNotRetry: ["429"]
      }
    });

    if (this.token) {
      this.verifyAuth();
    }
  }

  async verifyAuth() {
    try {
      const { data } = await this.octokit.rest.users.getAuthenticated();
      console.log("GitHubService authenticated as:", data.login);
    } catch (e) {
      console.warn("GitHubService auth check warning:", e.message);
    }
  }

  /**
   * Parse a GitHub repository URL into { owner, repo }.
   * @param {string} repoUrl
   */
  parseGitHubUrl(repoUrl) {
    let cleanUrl = repoUrl.trim();
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = `https://github.com/${cleanUrl.replace(/^github\.com\//, "")}`;
    }

    const url = new URL(cleanUrl);
    if (url.hostname !== "github.com") {
      throw new Error("Invalid GitHub URL: must be a github.com repository");
    }
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length < 2) {
      throw new Error("Invalid GitHub repository URL: missing owner or repository name");
    }
    return {
      owner: parts[0],
      repo: parts[1].replace(/\.git$/, "")
    };
  }

  /**
   * Fetch repository metadata (stars, forks, open issues, description, default branch, etc.).
   */
  async getRepositoryMetadata(owner, repo) {
    const { data } = await this.octokit.rest.repos.get({ owner, repo });
    return {
      name: data.name,
      fullName: data.full_name,
      description: data.description || "No description provided",
      stars: data.stargazers_count,
      forks: data.forks_count,
      watchers: data.watchers_count,
      openIssues: data.open_issues_count,
      defaultBranch: data.default_branch,
      language: data.language,
      license: data.license ? data.license.name : "None",
      sizeKb: data.size,
      updatedAt: data.updated_at,
      createdAt: data.created_at,
      htmlUrl: data.html_url
    };
  }

  /**
   * Fetch branches for the repository.
   */
  async getBranches(owner, repo) {
    try {
      const { data } = await this.octokit.rest.repos.listBranches({
        owner,
        repo,
        per_page: 30
      });
      return data.map((b) => ({
        name: b.name,
        commitSha: b.commit.sha,
        protected: b.protected
      }));
    } catch (e) {
      console.warn(`Could not fetch branches for ${owner}/${repo}:`, e.message);
      return [];
    }
  }

  /**
   * Fetch recent commits for the repository.
   */
  async getCommits(owner, repo, perPage = 15) {
    try {
      const { data } = await this.octokit.rest.repos.listCommits({
        owner,
        repo,
        per_page: perPage
      });
      return data.map((c) => ({
        sha: c.sha.substring(0, 7),
        fullSha: c.sha,
        message: c.commit.message,
        author: c.commit.author?.name || c.author?.login || "Unknown",
        date: c.commit.author?.date,
        url: c.html_url
      }));
    } catch (e) {
      console.warn(`Could not fetch commits for ${owner}/${repo}:`, e.message);
      return [];
    }
  }

  /**
   * Fetch language breakdown in bytes.
   */
  async getLanguages(owner, repo) {
    try {
      const { data } = await this.octokit.rest.repos.listLanguages({ owner, repo });
      return data;
    } catch (e) {
      console.warn(`Could not fetch languages for ${owner}/${repo}:`, e.message);
      return {};
    }
  }

  /**
   * Fetch git tree recursively.
   */
  async getRepositoryTree(owner, repo) {
    const response = await this.octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: "HEAD",
      recursive: "true"
    });
    return response.data.tree;
  }

  /**
   * Filter source files matching supported languages and excluding noise.
   */
  filterSourceFiles(tree) {
    const allowedExtensions = [
      ".js", ".jsx", ".ts", ".tsx",
      ".py", ".java", ".cpp", ".c", ".h", ".hpp",
      ".go", ".rs", ".php"
    ];
    const ignoredPaths = [
      "node_modules/", ".git/", "dist/", "build/",
      "coverage/", ".next/", "vendor/", "__pycache__/",
      ".vscode/", ".idea/", "target/", "bin/", "obj/"
    ];

    return tree.filter((item) => {
      if (item.type !== "blob") return false;
      const p = item.path.toLowerCase();
      if (ignoredPaths.some((ign) => p.includes(ign))) return false;
      return allowedExtensions.some((ext) => p.endsWith(ext));
    });
  }

  /**
   * Fetch single file content.
   */
  async getFileContent(owner, repo, filePath) {
    const response = await this.octokit.rest.repos.getContent({
      owner,
      repo,
      path: filePath
    });
    if (Array.isArray(response.data)) {
      throw new Error("Path is a directory, not a file");
    }
    if (response.data.encoding !== "base64") {
      throw new Error("Unsupported file encoding");
    }
    return Buffer.from(response.data.content, "base64").toString("utf-8");
  }

  /**
   * Fetch source files in manageable parallel chunks with concurrency limiting.
   */
  async getSourceFiles(owner, repo, sourceFiles, maxFiles = 400) {
    const pLimit = require("p-limit");
    const limit = pLimit(8); // 8 parallel requests max
    const filesToFetch = sourceFiles.slice(0, maxFiles);

    const results = await Promise.all(
      filesToFetch.map((file) =>
        limit(async () => {
          try {
            const content = await this.getFileContent(owner, repo, file.path);
            return { path: file.path, content };
          } catch (error) {
            console.log(`Skipping ${file.path}: ${error.message}`);
            return null;
          }
        })
      )
    );

    return results.filter(Boolean);
  }
}

module.exports = { GitHubService };

