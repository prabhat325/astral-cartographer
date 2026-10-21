const {
    parseGitHubUrl,
    getRepository
} = require("./githubClient");

async function test() {
    try {
        const repoUrl = "https://github.com/facebook/react";

        const { owner, repo } = parseGitHubUrl(repoUrl);

        console.log("Owner:", owner);
        console.log("Repository:", repo);

        const repository = await getRepository(owner, repo);

        console.log("Repository Name:", repository.name);
        console.log("Stars:", repository.stargazers_count);
    } catch (error) {
        console.error("Error:", error.message);
    }
}

test();