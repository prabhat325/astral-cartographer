import { formatData } from "./utils.js";
import { processA } from "./serviceA.js";
import { processB } from "./serviceB.js";

export function handleComplexDataPipeline(data, options = {}) {
  let result = [];

  if (!data || data.length === 0) {
    return null;
  }

  for (const item of data) {
    if (item.active && item.score > 50) {
      if (options.normalize) {
        result.push(processA(item.score));
      } else if (options.legacy) {
        result.push(processB(item.score));
      } else {
        result.push(formatData(item.title));
      }
    } else if (item.pending || item.retry) {
      if (options.strict) {
        throw new Error("Invalid item state");
      }
    } else {
      switch (item.type) {
        case "A":
          result.push("TypeA");
          break;
        case "B":
          result.push("TypeB");
          break;
        case "C":
          result.push("TypeC");
          break;
        default:
          result.push("Unknown");
      }
    }
  }

  return result;
}
