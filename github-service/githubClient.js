const { Octokit } = require("@octokit/rest");

const octokit = new Octokit();

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

module.exports = {
    parseGitHubUrl,
    getRepository,
    getRepositoryTree
};