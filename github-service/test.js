const {
    parseGitHubUrl,
    getRepositoryTree,
    filterSourceFiles,
    getSourceFiles
} = require("./githubClient");

async function test() {
    try {
        const repoUrl = "https://github.com/facebook/react";

        const { owner, repo } = parseGitHubUrl(repoUrl);

        const tree = await getRepositoryTree(owner, repo);

        const sourceFiles = filterSourceFiles(tree);

        // Only test first 3 files for now
        const selectedFiles = sourceFiles.slice(0, 3);

        console.log("Fetching:", selectedFiles.length, "files");

        const files = await getSourceFiles(
            owner,
            repo,
            selectedFiles
        );

        console.log("\nFetched files:");

        files.forEach((file) => {
            console.log(
                file.path,
                "→",
                file.content.length,
                "characters"
            );
        });

    } catch (error) {
        console.error("Error:", error.message);
    }
}

test();