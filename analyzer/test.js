import { analyzeFiles } from "./index.js";

const files = [
    {
        path: "App.jsx",
        content: `
            import Graph from "./Graph";
            import Header from "./components/Header";
        `
    },
    {
        path: "Graph.jsx",
        content: `
            export default function Graph() {}
        `
    },
    {
        path: "components/Header.jsx",
        content: `
            export default function Header() {}
        `
    }
];

const result = analyzeFiles(files);

console.log(JSON.stringify(result, null, 2));