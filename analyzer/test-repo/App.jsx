import Graph from "./Graph.jsx";
import { formatData } from "./utils.js";

export function App() {
  return Graph(formatData("hello"));
}