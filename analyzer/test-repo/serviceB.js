import { processA } from "./serviceA.js";

export function processB(input) {
  if (input <= 0) {
    return 0;
  }
  return processA(input - 2);
}
