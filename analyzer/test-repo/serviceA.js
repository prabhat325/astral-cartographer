import { processB } from "./serviceB.js";

export function processA(input) {
  if (input > 10) {
    return processB(input - 1);
  }
  return input * 2;
}
