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
        message: "Astral Cartographer GitHub Service is running"
    });
});

app.post("/analyze", async (req, res) => {
    try {
        const { repoUrl } = req.body;

        if (!repoUrl) {
            return res.status(400).json({
                error: "Repository URL is required"
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

        res.json({
            repository: {
                name: repository.name,
                fullName: repository.full_name,
                description: repository.description
            },
            files,
            architecture
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: error.message
        });
    }
});


const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});