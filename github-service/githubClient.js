const { Octokit } = require("@octokit/rest");

const octokit = new Octokit();

async function getRepository(owner, repo) {
    const response = await octokit.rest.repos.get({
        owner: owner,
        repo: repo
    });

    return response.data;
}

module.exports = {
    getRepository
};