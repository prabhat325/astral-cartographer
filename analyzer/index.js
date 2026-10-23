const { analyzeCode } = require("./analyzer");

function analyzeFiles(files) {
    const nodes = [];
    const edges = [];

    // Analyze every file
    const analyzedFiles = [];

    for (const file of files) {
        try {
            const result = analyzeCode(file.content, file.path);
            analyzedFiles.push(result);

            // File node
            nodes.push({
                id: file.path,
                type: "file"
            });

            // Function nodes
            for (const functionName of result.functions) {
                const functionId = `${file.path}::function:${functionName}`;

                nodes.push({
                    id: functionId,
                    type: "function",
                    name: functionName,
                    file: file.path
                });

                edges.push({
                    source: file.path,
                    target: functionId,
                    type: "contains"
                });
            }

            // Class nodes
            for (const className of result.classes) {
                const classId = `${file.path}::class:${className}`;

                nodes.push({
                    id: classId,
                    type: "class",
                    name: className,
                    file: file.path
                });

                edges.push({
                    source: file.path,
                    target: classId,
                    type: "contains"
                });
            }

        } catch (error) {
            console.log(`Error analyzing ${file.path}: ${error.message}`);
        }
    }

    // Create import edges
    for (const result of analyzedFiles) {
        for (const importPath of result.imports) {

            // Ignore external packages like React
            if (!importPath.startsWith(".")) {
                continue;
            }

            const target = resolveImportPath(
                result.file,
                importPath,
                files
            );

            if (target) {
                edges.push({
                    source: result.file,
                    target: target,
                    type: "imports"
                });
            }
        }
    }

    // Create function call edges
    for (const result of analyzedFiles) {
        for (const functionCall of result.functionCalls) {
            const targetFunction = nodes.find(
                (node) =>
                    node.type === "function" &&
                    node.name === functionCall
            );

            if (targetFunction) {
                edges.push({
                    source: result.file,
                    target: targetFunction.id,
                    type: "calls"
                });
            }
        }
    }

    return {
        nodes,
        edges
    };
}

function resolveImportPath(currentFile, importPath, files) {
    const currentDirectory = currentFile
        .split("/")
        .slice(0, -1)
        .join("/");

    let targetPath = currentDirectory
        ? `${currentDirectory}/${importPath}`
        : importPath;

    targetPath = normalizePath(targetPath);

    const possiblePaths = [
        targetPath,
        `${targetPath}.js`,
        `${targetPath}.jsx`,
        `${targetPath}.ts`,
        `${targetPath}.tsx`,
        `${targetPath}.py`,
        `${targetPath}.java`,
        `${targetPath}.cpp`,
        `${targetPath}/index.js`,
        `${targetPath}/index.jsx`
    ];

    const match = files.find((file) =>
        possiblePaths.includes(file.path)
    );

    return match ? match.path : null;
}

function normalizePath(path) {
    const parts = path.split("/");
    const result = [];

    for (const part of parts) {
        if (!part || part === ".") {
            continue;
        }

        if (part === "..") {
            result.pop();
        } else {
            result.push(part);
        }
    }

    return result.join("/");
}

module.exports = {
    analyzeFiles
};