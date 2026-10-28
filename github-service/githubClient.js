const { GitHubService } = require("./GitHubService");

const defaultService = new GitHubService();

module.exports = {
  GitHubService,
  parseGitHubUrl: (url) => defaultService.parseGitHubUrl(url),
  getRepository: (owner, repo) => defaultService.getRepositoryMetadata(owner, repo),
  getRepositoryTree: (owner, repo) => defaultService.getRepositoryTree(owner, repo),
  filterSourceFiles: (tree) => defaultService.filterSourceFiles(tree),
  getFileContent: (owner, repo, path) => defaultService.getFileContent(owner, repo, path),
  getSourceFiles: (owner, repo, files) => defaultService.getSourceFiles(owner, repo, files),
  getBranches: (owner, repo) => defaultService.getBranches(owner, repo),
  getCommits: (owner, repo) => defaultService.getCommits(owner, repo),
  getLanguages: (owner, repo) => defaultService.getLanguages(owner, repo)
};
