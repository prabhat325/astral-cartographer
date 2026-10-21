const { getRepository } = require("./githubClient");

async function test() {
    try {
        const repo = await getRepository("facebook", "react");

        console.log("Repository Name:", repo.name);
        console.log("Owner:", repo.owner.login);
        console.log("Stars:", repo.stargazers_count);
    } catch (error) {
        console.error("Error:", error.message);
    }
}

test();