import { scanFiles } from "./fileScanner.js";

const files = await scanFiles("./test-repo");

console.log(
  files.map((file) => file.path)
);