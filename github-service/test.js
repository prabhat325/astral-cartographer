const {
    parseGitHubUrl,
    getRepositoryTree,
    filterSourceFiles
} = require("./githubClient");

async function test() {
    try {
        const repoUrl = "https://github.com/facebook/react";

        const { owner, repo } = parseGitHubUrl(repoUrl);

        const tree = await getRepositoryTree(owner, repo);

        const sourceFiles = filterSourceFiles(tree);

        console.log("Total repository items:", tree.length);
        console.log("Source files:", sourceFiles.length);

        console.log("\nFirst 10 source files:");

        sourceFiles.slice(0, 10).forEach((file) => {
            console.log(file.path);
        });

    } catch (error) {
        console.error("Error:", error.message);
    }
}

test();