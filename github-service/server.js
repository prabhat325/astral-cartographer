require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { analyzeFiles } = require("../analyzer");
const {
    parseGitHubUrl,
    getRepository,
    getRepositoryTree,
    filterSourceFiles,
    getSourceFiles
} = require("./githubClient");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "Astral Cartographer Backend Service is running"
    });
});

async function handleAnalyze(req, res) {
    try {
        const { repoUrl } = req.body;

        if (!req.body || typeof req.body !== "object") {
            return res.status(400).json({
                success: false,
                error: "Request body must be a JSON object"
            });
        }

        if (typeof repoUrl !== "string" || !repoUrl.trim()) {
            return res.status(400).json({
                success: false,
                error: "A valid repoUrl is required"
            });
        }

        let parsedUrl;
        try {
            parsedUrl = new URL(repoUrl);
        } catch {
            return res.status(400).json({
                success: false,
                error: "Invalid URL format"
            });
        }

        if (
            parsedUrl.protocol !== "https:" ||
            parsedUrl.hostname !== "github.com"
        ) {
            return res.status(400).json({
                success: false,
                error: "Please provide a valid GitHub repository URL"
            });
        }

        const { owner, repo } = parseGitHubUrl(repoUrl);

        const repository = await getRepository(owner, repo);

        const tree = await getRepositoryTree(owner, repo);

        const sourceFiles = filterSourceFiles(tree);

        const files = await getSourceFiles(
            owner,
            repo,
            sourceFiles
        );

        const architecture = analyzeFiles(files);

        return res.json({
            success: true,
            repository: {
                name: repository.name,
                fullName: repository.full_name,
                description: repository.description
            },
            totalFiles: files.length,
            files,
            architecture
        });

    } catch (error) {
        console.error("Analysis request failed:", error.message);

        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

// Support both /analyze and /api/analyze endpoints
app.post("/analyze", handleAnalyze);
app.post("/api/analyze", handleAnalyze);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});