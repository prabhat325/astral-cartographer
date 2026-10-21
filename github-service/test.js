const {
    parseGitHubUrl,
    getRepositoryTree
} = require("./githubClient");

async function test() {
    try {
        const repoUrl = "https://github.com/facebook/react";

        const { owner, repo } = parseGitHubUrl(repoUrl);

        console.log("Owner:", owner);
        console.log("Repository:", repo);

        const tree = await getRepositoryTree(owner, repo);

        console.log("Total items:", tree.length);

        console.log("\nFirst 10 items:");

        tree.slice(0, 10).forEach((item) => {
            console.log(item.path, "-", item.type);
        });

    } catch (error) {
        console.error("Error:", error.message);
    }
}

test();