

import path from "node:path";
import { readdir, readFile } from "node:fs/promises";

const EXTENSIONS = new Set([
  ".js", ".jsx", ".mjs", ".cjs",
  ".ts", ".tsx", ".mts", ".cts"
]);

const IGNORED = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage"
]);

export async function scanFiles(repoPath) {
  const root = path.resolve(repoPath);
  const files = [];

  async function walk(directory) {
    const entries = await readdir(directory, {
      withFileTypes: true
    });

    for (const entry of entries) {
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory() && IGNORED.has(entry.name)) continue;

      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (
        entry.isFile() &&
        EXTENSIONS.has(path.extname(entry.name).toLowerCase())
      ) {
        files.push({
          path: path.relative(root, fullPath).split(path.sep).join("/"),
          content: await readFile(fullPath, "utf8")
        });
      }
    }
  }

  await walk(root);

  return files.sort((a, b) => a.path.localeCompare(b.path));
}
