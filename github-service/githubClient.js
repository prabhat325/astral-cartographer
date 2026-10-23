
const { Octokit } = require("@octokit/rest");

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});
function parseGitHubUrl(repoUrl) {
    const url = new URL(repoUrl);

    if (url.hostname !== "github.com") {
        throw new Error("Invalid GitHub URL");
    }

    const parts = url.pathname.split("/").filter(Boolean);

    if (parts.length < 2) {
        throw new Error("Invalid GitHub repository URL");
    }

    return {
        owner: parts[0],
        repo: parts[1].replace(".git", "")
    };
}

async function getRepository(owner, repo) {
    const response = await octokit.rest.repos.get({
        owner,
        repo
    });

    return response.data;
}
async function getRepositoryTree(owner, repo) {
    const response = await octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: "HEAD",
        recursive: "true"
    });

    return response.data.tree;
}
function filterSourceFiles(tree) {
    const allowedExtensions = [
        ".js",
        ".jsx",
        ".ts",
        ".tsx",
        ".py",
        ".java",
        ".cpp",
        ".c",
        ".h",
        ".go",
        ".rs",
        ".php"
    ];

    const ignoredPaths = [
        "node_modules/",
        ".git/",
        "dist/",
        "build/",
        "coverage/"
    ];

    return tree.filter((item) => {
        if (item.type !== "blob") {
            return false;
        }

        const path = item.path.toLowerCase();

        if (ignoredPaths.some((ignored) => path.includes(ignored))) {
            return false;
        }

        return allowedExtensions.some((extension) =>
            path.endsWith(extension)
        );
    });
}
async function getFileContent(owner, repo, path) {
    const response = await octokit.rest.repos.getContent({
        owner,
        repo,
        path
    });

    if (Array.isArray(response.data)) {
        throw new Error("The provided path is a directory, not a file");
    }

    if (response.data.encoding !== "base64") {
        throw new Error("Unsupported file encoding");
    }

    return Buffer
        .from(response.data.content, "base64")
        .toString("utf-8");
}
async function getSourceFiles(owner, repo, sourceFiles) {
    const files = [];

    for (const file of sourceFiles) {
        try {
            const content = await getFileContent(
                owner,
                repo,
                file.path
            );

            files.push({
                path: file.path,
                content: content
            });
        } catch (error) {
            console.log(
                `Skipping ${file.path}: ${error.message}`
            );
        }
    }

    return files;
}
module.exports = {
    parseGitHubUrl,
    getRepository,
    getRepositoryTree,
    filterSourceFiles,
    getFileContent,
    getSourceFiles
};