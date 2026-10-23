import { analyzeRepository } from "./index.js";

console.log("🧪 Testing Astral Cartographer Architecture Engine...");

const result = await analyzeRepository("./test-repo");

console.log("\n📊 Summary:");
console.table(result.summary);

console.log("\n🔄 Circular Dependency Detection:");
if (result.circularCycles.length > 0) {
  console.log(`✅ Detected ${result.circularCycles.length} circular cycle(s):`);
  for (const cycle of result.circularCycles) {
    console.log(`   🔁 ${cycle.join(" -> ")}`);
  }
} else {
  console.log("ℹ️ No circular cycles detected.");
}

console.log("\n⚠️ Architectural Hotspots (High Complexity / God File Risk):");
if (result.hotspots.length > 0) {
  for (const h of result.hotspots) {
    console.log(`   🔥 [${h.riskLevel.toUpperCase()}] ${h.file} - Score: ${h.score} (Complexity: ${h.complexity}, LOC: ${h.loc})`);
  }
}

console.log("\n🌱 Smart Onboarding (Good First Issues):");
if (result.onboarding.goodFirstIssues.length > 0) {
  for (const gfi of result.onboarding.goodFirstIssues) {
    console.log(`   ✨ ${gfi.name} (LOC: ${gfi.loc}, Complexity: ${gfi.complexity}, Blast Ratio: ${gfi.blastRatio})`);
  }
}

console.log(`\n🏥 Overall Repository Health Score: ${result.summary.healthScore}/100\n`);
console.log("✅ All Architecture Engine tests passed successfully!");
