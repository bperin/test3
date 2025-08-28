module.exports = {
    testEnvironment: "node",
    collectCoverageFrom: ["src/**/*.js", "!src/index.js", "!**/node_modules/**"],
    coverageDirectory: "coverage",
    coverageReporters: ["text", "lcov", "html"],
    testMatch: ["**/__tests__/**/*.js", "**/?(*.)+(spec|test).js"],
    verbose: true,
};
