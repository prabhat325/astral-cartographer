const {
    parseGitHubUrl,
    getFileContent
} = require("./githubClient");

async function test() {
    try {
        const repoUrl = "https://github.com/facebook/react";

        const { owner, repo } = parseGitHubUrl(repoUrl);

        const filePath = "README.md";

        const content = await getFileContent(
            owner,
            repo,
            filePath
        );

        console.log("File:", filePath);
        console.log("\nFile content:\n");
        console.log(content.slice(0, 1000));

    } catch (error) {
        console.error("Error:", error.message);
    }
}

test();