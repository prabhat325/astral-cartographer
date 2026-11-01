The Astral Cartographer

Interactive codebase architecture and dependency explorer for GitHub repositories.

Webster 2026 · Team ID 262 · Team DeDevelopers

Member
Shreya Chand
Chanchal Sahu
Prabhat Dubey
Description of the Problem

Massive software repositories resemble sprawling labyrinths. A developer who joins an unfamiliar project has to open hundreds of files, trace imports by hand, and guess which modules are safe to change.

The Astral Cartographer is a web-based tool that automatically analyzes a GitHub repository and converts its source code structure into an interactive architectural/dependency graph. It helps developers understand complex codebases by visualizing files, classes, functions, imports, and their relationships in one place, and by pointing out the risky parts: circular imports, god files and complexity hotspots.

Website name: The Astral Cartographer

Process Flow of the Website
The user enters a GitHub repository URL (or owner/repo), or opens the built-in demo repository.
The Node.js backend validates the repository and fetches its file tree and source files through the GitHub REST API.
Every source file is parsed with AST (Abstract Syntax Tree) parsing.
The analyzer extracts files, functions, classes, imports and function calls.
A dependency/architecture graph is generated, together with metrics: complexity, coupling, circular dependencies, blast radius and a health score.
The graph is displayed interactively on the frontend.
The user clicks any node to view its code and relationships, and searches or filters to find specific files.
Features

All features below are implemented and visible in the UI.

Feature	What it does
GitHub repository URL ingestion	Paste a URL or owner/repo, pick a curated repository, or open the built-in demo repository
Interactive dependency graph	Force-directed file graph (D3). Zoom, pan, drag nodes. Node size and colour show importance and architectural layer
Function call graph	Caller to callee edges across the repository
File, class and function exploration	Code Explorer lists every file with symbols, imports and calls
Code preview	Source code with line numbers next to the file's metrics (lines, tokens, complexity, blast radius)
Search and filtering	Find a node by name in the graph, search and sort files in the Code Explorer
Dependency tracing	Selecting a node shows its outgoing dependencies, the files that import it, and its transitive blast radius
Circular dependency detection	Lists every import cycle and highlights the edges in red
Complexity hotspots and god files	Ranks files by a composite risk score
Architecture health score	0 to 100 score with a grade and a risk breakdown
Smart onboarding pathfinder	Suggests safe first files for a newcomer and the core hubs to read first
Zoom, pan and graph navigation	Zoom controls, drag, and a toggle between the top 120 nodes and all nodes
Pages

Overview · Dependency Graph · Function Call Graph · Code Explorer · Circular Dependencies · Complexity Hotspots · Smart Onboarding · Health Scorecard

Backend-ready, not yet in the UI
AI-powered code explanation. POST /api/ai/explain is implemented. It uses Google Gemini when GEMINI_API_KEY is set and a built-in rule-based expert otherwise. The frontend does not call it yet.
Repository statistics. The backend already collects stars, forks, branches, recent commits and the language breakdown. The frontend does not display them yet.
External Libraries / APIs
Library / API	Used for	Why chosen
GitHub REST API (Octokit)	Repository metadata, file tree, file contents, branches, commits, languages	The official, well-documented API with everything we need. Octokit plugins add throttling and retry
Babel Parser (@babel/parser)	Parses JavaScript, JSX and TypeScript into an AST	Fast, handles JSX and TypeScript, and recovers from syntax errors
D3.js	Force-directed interactive graph, zoom and pan	Full control over nodes, edges and interaction
React 19 + Vite	Frontend and dashboard	Component-based UI, fast development and builds
Node.js + Express	Backend API, repository processing, communication with the analyzer	Same language as the frontend, large package ecosystem
node-cache, p-limit, express-rate-limit	Caching, concurrency limiting, request limiting	Large-repository handling (see below)
Google Gemini (optional)	Natural-language code explanation	Optional enhancement, falls back to a built-in engine

JavaScript and TypeScript are parsed into a real AST. Python, Java, Go, C/C++, Rust and PHP are analyzed with line-based pattern extraction, which is approximate.

Core Engineering Architecture
User
React + Vite frontend :5173
RepositoryController :5000
GitHubService
GitHub REST API
Analyzer engine
CodeParser: Babel AST
ASTAnalyzer
DependencyAnalyzer
GraphBuilder
AnalysisResult JSON
D3 interactive graph

Data flow

The user enters a GitHub repository URL.
RepositoryController validates it and checks the cache.
GitHubService fetches metadata and the file tree, filters source files, and downloads them in parallel.
CodeParser and ASTAnalyzer parse each file and extract imports, symbols, calls and metrics.
DependencyAnalyzer resolves imports to real files and builds the relationships between them.
GraphBuilder produces file, class and function graphs and runs the graph analysis (cycles, blast radius, hotspots, onboarding, health score).
The result is returned as JSON and rendered by the frontend with D3.
Handling Large Repositories / Heavy Load

The naive way. Download and parse the complete repository on every request, then send the entire graph to the browser. This causes high latency, excessive memory use and repeated computation, especially for large repositories or several simultaneous users.

Our way.

Repository-level caching. Results are cached in memory for 30 minutes (node-cache), so a repeated request skips GitHub and parsing entirely.
Parallel, bounded fetching. Source files are downloaded concurrently, at most 8 requests at a time (p-limit), so a repository is never fetched all at once.
File cap. At most 400 source files per repository are analyzed, which keeps memory and response size bounded.
API rate-limit handling. The Octokit throttling and retry plugins back off and retry when GitHub limits requests. Adding a GITHUB_TOKEN raises the limit from 60 to 5,000 requests per hour.
Request limiting. The analysis endpoint allows 30 requests per 15 minutes per IP.
Graph data filtering. The graph first renders only the 120 most connected nodes. A toggle shows all nodes.
Failure isolation. Each file is analyzed in its own try/catch. A file that fails to parse is reported in the result's errors list and does not stop the analysis.

Why it wins. Less processing time and memory, no repeated computation, steadier behaviour on large codebases, and a responsive graph even when several users analyze repositories at once.

Class Diagram: Main Classes
Class	Location	Responsibility
RepositoryController	github-service/RepositoryController.js	Handles user requests, validates input, manages the cache, coordinates the services
GitHubService	github-service/GitHubService.js	Talks to the GitHub API: metadata, file tree, file contents, branches, commits, languages
CodeParser	analyzer/src/CodeParser.js	Detects the language and parses JavaScript/TypeScript into an AST with Babel
ASTAnalyzer	analyzer/src/ASTAnalyzer.js	Extracts functions, classes, methods, imports, calls, lines of code and cyclomatic complexity
DependencyAnalyzer	analyzer/src/DependencyAnalyzer.js	Resolves imports to files, computes coupling, circular cycles, blast radius, god files and the health score
GraphBuilder	analyzer/src/GraphBuilder.js	Converts dependencies into file, class and function graph nodes and edges
AnalysisResult	analyzer/src/AnalysisResult.js	Stores the processed architecture, metrics and summary
VisualizationService	analyzer/src/VisualizationService.js	Optional utility that filters and limits graph data. Not used in the current request path
How the Metrics Work
Cyclomatic complexity = 1 + the number of decision points (if, ternary, loops, catch, non-default case, &&, ||, ??), counted per function and per file.
Circular dependencies are found with a depth-first search over the file import graph (ES import and re-export edges). An edge back into a file that is still on the search stack closes a cycle.
Blast radius of a file is the number of files that import it directly or indirectly (breadth-first search on the reversed graph of the same edges).
God file score = inDegree x 1.5 + outDegree x 0.8 + complexity x 0.4 + (LOC / 25) x 0.3. A file is critical at a score of 18 or more, or with complexity 15+ and 5+ dependents.
Health score starts at 100 and subtracts 15 per circular cycle (max 40), 10 per god file (max 30) and up to 20 when average complexity is above 10. It never goes below 10.
Onboarding pathfinder marks low-complexity, small, isolated files outside any cycle as safe first contributions, and heavily depended-on files as core hubs.
Quick Start
One command (Windows)
bash
run-all.bat

(or run-all.ps1 in PowerShell). It starts all three services and opens http://localhost:5173.

Manual start (three terminals)
bash
# 1. Analyzer engine (port 5050)
cd analyzer
npm install
npm run serve

# 2. GitHub service backend (port 5000)
cd github-service
npm install
npm start

# 3. Frontend (port 5173)
cd frontend/astral-frontend
npm install
npm run dev

Open http://localhost:5173 and click Built-in Demo Repo to explore the full architecture immediately.

Configuration

Create github-service/.env:

env
GITHUB_TOKEN=your_github_token
GEMINI_API_KEY=your_gemini_key
GITHUB_TOKEN is strongly recommended. Without it GitHub allows only 60 requests per hour, and analysis of any real repository stalls on the rate limit.
GEMINI_API_KEY is optional.
Never commit .env. It is already listed in .gitignore.

The frontend finds the services at http://localhost:5000 and http://localhost:5050. Override with VITE_GITHUB_SERVICE_URL and VITE_ANALYZER_URL.

Testing and Verification
bash
# Analyzer test
cd analyzer
npm test

# Frontend lint and production build
cd frontend/astral-frontend
npm run lint
npm run build
Project Structure
astral-cartographer/
├── analyzer/            Code analysis engine (Babel AST, graph building, metrics)
├── github-service/      Node.js backend (GitHub API, caching, rate limiting)
├── frontend/
│   └── astral-frontend/ React + Vite dashboard (D3 graph)
├── run-all.bat          Starts all services on Windows
└── run-all.ps1          Starts all services in PowerShell
Known Limitations
Only the first 400 source files of a repository are analyzed, so scores for very large repositories describe a sample.
Python, Java, Go, C/C++, Rust and PHP are analyzed with pattern matching, not a full AST, so their results are approximate.
The function call graph links a call to a function by name, so two functions with the same name in different files can be merged.
Circular dependency detection and blast radius follow ES import and re-export edges. In projects written with CommonJS require(), they can report fewer cycles and a smaller blast radius than the real ones.