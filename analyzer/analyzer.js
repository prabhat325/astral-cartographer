const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

function analyzeCode(code, filePath) {
    const ast = parser.parse(code, {
        sourceType: "unambiguous",
        plugins: ["jsx", "typescript"]
    });

    const imports = [];
    const functions = [];
    const classes = [];
    const functionCalls = [];

    traverse(ast, {
        ImportDeclaration(path) {
            imports.push(path.node.source.value);
        },

        FunctionDeclaration(path) {
            if (path.node.id) {
                functions.push(path.node.id.name);
            }
        },

        ClassDeclaration(path) {
            if (path.node.id) {
                classes.push(path.node.id.name);
            }
        },

        CallExpression(path) {
            if (
                path.node.callee.type === "Identifier" &&
                path.node.callee.name
            ) {
                functionCalls.push(path.node.callee.name);
            }
        }
    });

    return {
        file: filePath,
        imports,
        functions,
        classes,
        functionCalls
    };
}

module.exports = {
    analyzeCode
};