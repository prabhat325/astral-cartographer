# The Astral Cartographer — Architectural & Dependency Intelligence

---

## 🌌 Description of the Problem

**The Astral Cartographer** is a web-based tool that automatically analyzes a GitHub repository and converts its source code structure into an interactive architectural/dependency graph. It helps developers understand complex codebases by visualizing files, classes, functions, imports, and their relationships in one place.

---

## 🔄 Process Flow of the Website

```
User enters GitHub URL ➔ Backend fetches/clones repository ➔ Code is parsed using AST parsing ➔ 
System extracts files, functions, classes, imports & dependencies ➔ Dependency/Architecture graph generated ➔ 
Cystoscope.js renders interactive frontend graph ➔ User explores nodes, relationships & code previews ➔ 
Search/filter finds specific files, functions or classes ➔ AI explains code & flags architectural issues
```

---

## 🏛️ Core Engineering Architecture & Class Diagram

```
User ➔ React Frontend ➔ Node.js Backend ➔ GitHub REST API ➔ CodeParser (Tree-sitter & Babel) ➔ 
ASTAnalyzer ➔ DependencyAnalyzer ➔ GraphBuilder ➔ AnalysisResult ➔ VisualizationService ➔ Cystoscope.js
```

### Main Classes (PDF Class Diagram Specification)
1. **`RepositoryController`**: Handles user HTTP requests (`/api/analyze`, `/api/ai/explain`, `/cache`), validates repositories, manages caching, and coordinates services.
2. **`GitHubService`**: Communicates with GitHub REST API: retrieves repository metadata, tree structure, source files, branches, commits, and language stats with throttling and rate-limit handling.
3. **`CodeParser`**: Multi-language AST code parser supporting Tree-sitter & robust grammars across JavaScript, TypeScript, Python, Java, Go, C/C++, Rust, and PHP.
4. **`ASTAnalyzer`**: Extracts functions, classes, methods, imports, and dependencies, and calculates Cyclomatic Complexity $V(G)$ and Lines of Code (LOC).
5. **`DependencyAnalyzer`**: Identifies relationships between components, afferent/efferent coupling ($C_a, C_e$), circular cycles, blast radius, God file hotpots, and architectural health.
6. **`GraphBuilder`**: Converts dependencies into multi-scope graph models: File Graph, Class Hierarchy Graph, and Function Call Graph.
7. **`AnalysisResult`**: Stores and encapsulates processed architecture information, metrics, symbols, and summary reports.
8. **`VisualizationService`**: Prepares, filters, and formats graph elements for Cystoscope.js rendering with level-of-detail (LOD) aggregation and path tracing.

---

## 🚀 Key Implemented Features

### 1. GitHub Repository URL Ingestion
- Ingest any public GitHub repository via URL or `owner/repo` slug.
- Fetches metadata, branches, commits, tree structure, and source files directly via GitHub REST API.

### 2. Interactive Dependency / Architecture Graph (Cystoscope.js)
- Multi-mode graph visualization:
  - **📁 Files View**: Module-level dependency graph with circular loops and God files highlighted.
  - **🏛️ Classes View**: Class and struct hierarchy with inheritance and extension links.
  - **⚡ Functions View**: Function call graph with caller $\rightarrow$ callee edges.
- Multiple layout algorithms: CoSE Force-Directed, Breadth-First, Concentric, Circle, and Grid.
- Node size scales proportionally to afferent coupling / centrality.

### 3. Dependency Tracing
- **Downstream Tracing**: Trace all outgoing transitive dependencies of a component.
- **Upstream Tracing**: Trace all incoming dependents that rely on a component.
- **Shortest Path Tracing**: Pick any Source and Target node to spotlight the exact dependency chain.
- **Blast Radius Tracing**: Highlight all downstream affected files if a module is modified.
- **Circular Cycle Spotlight**: Interactive dropdown to center and spotlight circular dependency loops.

### 4. File, Class & Function Exploration & Code Preview
- Deep exploration of files, classes, methods, and functions with line numbers, signatures, and complexity.
- Inline **Code Preview** directly inside the Dependency Explorer Inspector panel.
- Dedicated **Code Explorer** page with search, sorting by LOC/CC/coupling, and symbol navigation.

### 5. Multi-dimensional Search & Filtering
- Search nodes by name across files, classes, or functions.
- Filter by Architectural Layer / Cluster (`core`, `ui`, `api`, `state`, `utils`, `config`).
- Filter by Language / Extension (`.js`, `.jsx`, `.ts`, `.tsx`, `.py`, `.go`, `.java`, `.cpp`, `.rs`, `.php`).
- Filter by Risk: God Files, Circular Loops, High Cyclomatic Complexity ($CC > 8$).

### 6. Repository Statistics
- GitHub Metadata: Stars, Forks, Watchers, Open Issues, Default Branch, License, and Repo Size.
- **Recent Commits Log**: Timeline of commits with author, date, and commit SHA.
- **Branches List**: Branch names with protected status badges.
- **Language Breakdown**: Visual multi-color distribution bar and detailed percentage breakdown.
- Code Metrics: Total Files, Total Code LOC, Classes, Functions, Imports, Call Expressions, and Average CC.

### 7. Code Complexity & Architecture Health Score
- Cyclomatic Complexity $V(G) = 1 + \text{decision points}$ across all supported languages.
- Composite **Health Score (0–100)** with grade and risk breakdown gauges (Circular Risk, Coupling Risk, Complexity Risk).
- **God File Hotpots**: Composite scoring based on $1.5 \times C_a + 0.8 \times C_e + 0.4 \times CC + 0.3 \times \frac{LOC}{25}$.

### 8. AI-Powered Code Explanation & Architectural Issue Detection
- Seamless dual-engine design:
  - Powered by **Google Gemini 1.5 Flash** when `GEMINI_API_KEY` is configured.
  - Built-in **Architectural AI Expert** heuristics engine fallback when offline or without external API keys.
- Analyzes Purpose, Key Responsibilities, Architectural Observations (God files, circular loops, high coupling), and Actionable Refactoring Recommendations.

### 9. Smart Onboarding Pathfinder for New Developers
- 4-Phase Guided Contributor Journey:
  - **Stage 1: Good First Issues & Safe Entry Points** (low CC, low LOC, isolated, 0 blast radius).
  - **Stage 2: Utilities, Shared Types & Configs** (understand data contracts).
  - **Stage 3: Feature Services & Components** (business logic).
  - **Stage 4: Core Architectural Hubs & Orchestrators** (high coupling, must read first).
- 1-click "Inspect in Graph" and "Preview Code" for every onboarding candidate.

### 10. Zoom, Pan & Interactive Navigation
- Zoom In, Zoom Out, Fit to Screen, Recompute Layout, Fullscreen mode.
- Export Graph as high-resolution **PNG image** or **JSON format**.

### 11. Large Repository & Heavy Load Engineering
- **Repository-Level Caching**: `NodeCache` with 30-minute TTL and cache hit/miss tracking.
- **Incremental Chunking**: Parallel file fetching via `p-limit` (8 concurrent requests max).
- **Level of Detail (LOD) Aggregation**: Renders top 150 central nodes initially with instant toggle to show all nodes.

---

## 🏃 Quick Start Guide

### 1. Start the Code Analyzer Engine (Port 5050)
```bash
cd analyzer
npm install
npm run serve
```

### 2. Start the GitHub Service Backend (Port 5000)
```bash
cd github-service
npm install
npm start
```
*(Optional: add `GITHUB_TOKEN=...` and `GEMINI_API_KEY=...` to `github-service/.env`)*

### 3. Start the Frontend (Vite, Port 5173)
```bash
cd frontend/astral-frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser. Click **"⚡ Built-in Demo Repo"** to explore the complete architecture immediately!

---

## 🧪 Testing & Verification

Run the Analyzer test suite:
```bash
cd analyzer
npm test
npm run test:
```

Run Frontend linting and production build:
```bash
cd frontend/astral-frontend
npm run lint
npm run build
```
