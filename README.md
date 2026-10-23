# Astral Cartographer — Architecture & AST Intelligence Engine

> **Problem Statement (PS6):** Unpack massive repository complexity by parsing git repositories, analyzing Abstract Syntax Trees (ASTs), computing architectural health metrics, and rendering interactive topological dependency atlases.

---

## 🏛️ System Architecture & Role Division

```
             USER
               │
               ▼
        ┌──────────────┐
        │   FRONTEND   │  Person 1: 2D/3D Interactive Dependency Atlas,
        │  (Person 1)  │            Code Exploration Panel, Filter & Search
        └──────┬───────┘
               │  REST / WebSocket
               ▼
        ┌──────────────┐
        │   BACKEND    │  Person 2: GitHub repo ingestion, clone/unzip,
        │  (Person 2)  │            caching, rate-limiting & orchestrator
        └──────┬───────┘
               │  In-Memory / HTTP POST /analyze
               ▼
        ┌──────────────┐
        │   ANALYZER   │  🔥 Person 3 (This Engine):
        │  (Person 3)  │  AST parsing, Cyclomatic Complexity, Cycle Detection,
        └──────────────┘  God File Scoring, Blast Radius & Onboarding Pathways
```

---

## 🚀 Engine Capabilities (Ascended Mastery Tier)

### 1. Deep AST Parsing & Symbol Resolution
- **Parser:** `@babel/parser` with tolerant error recovery (`errorRecovery: true`), supporting JavaScript, JSX, TypeScript, TSX, dynamic imports (`import(...)`), CommonJS (`require(...)`), and ES6 module re-exports.
- **Symbol Extraction:** Functions (declarations & exported arrow expressions), classes, methods, TypeScript interfaces & type aliases, with line numbers, export indicators, and parameter signatures.
- **Call Graph Mapping:** Maps call expressions inside scopes to target callees (`caller -> callee`).

### 2. Code Exploration & Complexity Metrics
- **Cyclomatic Complexity $V(G)$:** Traverses AST branching decision points (`IfStatement`, `ConditionalExpression`, `Loops`, `CatchClause`, `SwitchCase`, logical operators `&&`, `||`, `??`).
- **Token Counts & LOC:** Computes total lines of code, code lines, comment lines, blank lines, and lexical token density.

### 3. Graph Intelligence Algorithms
- **Circular Dependency Detection:** Directed DFS graph traversal with recursion back-edge tracking to pinpoint cyclic import loops (e.g. `serviceA -> serviceB -> serviceA`). Cyclic edges are automatically flagged with `isCircular: true`.
- **Architectural Clustering:** Classifies modules into architectural layers (`ui`, `api`, `state`, `utils`, `config`, `core`).
- **Transitive Blast Radius:** Reverse dependency graph traversal computing the downstream impact ratio if a file is modified:
  $$\text{Blast Radius Ratio} = \frac{\text{Affected Downstream Files}}{\text{Total Files} - 1}$$
- **Architectural Health & "God File" Hotspots:**
  Composite risk scoring based on Fan-In (dependents), Fan-Out, Cyclomatic Complexity, and LOC. Identifies fragile high-risk modules and technical debt hotspots.
- **Smart Onboarding Pathfinder:**
  Automatically identifies **Good First Issues** (isolated modules with low complexity and zero/low blast radius) suitable for beginner pull requests.

---

## 🔌 API & Integration Guide (For Person 2 Backend)

### Method A: Microservice Mode (HTTP API)
Start the Analyzer server on port 5050:
```bash
npm run serve
```

Send a `POST` request to `http://localhost:5050/analyze` with either files in memory or a folder path:
```json
// POST /analyze
{
  "files": [
    { "path": "src/App.jsx", "content": "import Graph from './Graph'; export function App() {}" },
    { "path": "src/Graph.jsx", "content": "export default function Graph() {}" }
  ]
}
```

Or by directory path:
```json
// POST /analyze
{
  "repoPath": "./cloned-repos/react-sample"
}
```

### Method B: Direct Node.js Import
```javascript
import { analyzeRepository, analyzeFiles } from "./analyzer/src/index.js";

// Option 1: Analyze directory on disk
const result = await analyzeRepository("./path/to/repo");

// Option 2: Analyze files in memory (from GitHub API or memory zip)
const result = await analyzeFiles([
  { path: "App.jsx", content: "..." },
  { path: "utils.js", content: "..." }
]);
```

---

## 🧪 Testing & Benchmark Execution

Run the built-in test suite:
```bash
cd analyzer
npm test
```

Run CLI against any repository:
```bash
cd analyzer
npm run analyze -- ./test-repo
```
Results will be saved to `analyzer/analysis.json`.
