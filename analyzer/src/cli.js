
import path from "node:path";
import { writeFile } from "node:fs/promises";
import { analyzeRepository } from "./index.js";

const repoPath = process.argv[2];

if (!repoPath) {
  console.error("Usage: npm run analyze -- <repository-folder>");
  process.exitCode = 1;
} else {
  try {
    const result = await analyzeRepository(path.resolve(repoPath));
    const outputPath = path.resolve("analysis.json");

    await writeFile(outputPath, JSON.stringify(result, null, 2));

    console.log("Analysis complete!");
    console.log(result.summary);
    console.log(`Output: ${outputPath}`);
  } catch (error) {
    console.error("Analysis failed:", error.message);
    process.exitCode = 1;
  }
}
