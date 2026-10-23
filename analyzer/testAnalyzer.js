import { analyzeFiles } from "./index.js";

const files = [
    {
        path: "App.jsx",
        content: `
            import React from "react";
            import Graph from "./Graph";

            function App() {
                return <Graph />;
            }
        `
    },
    {
        path: "Graph.jsx",
        content: `
            import React from "react";

            function Graph() {
                return <div>Hello</div>;
            }
        `
    }
];

const result = analyzeFiles(files);

console.log(JSON.stringify(result, null, 2));