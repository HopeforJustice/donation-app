const nextJest = require("next/jest");

/** @type {import('jest').Config} */
const createJestConfig = nextJest({
	// Provide the path to your Next.js app to load next.config.js and .env files in your test environment
	dir: "./",
});

// Add any custom config to be passed to Jest
const config = {
	coverageProvider: "v8",
	testEnvironment: "jsdom",
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/src/$1",
		"^@tests/(.*)$": "<rootDir>/__tests__/$1",
	},
	collectCoverage: true,
	collectCoverageFrom: ["src/app/**/*.{js,jsx,ts,tsx}"],
	testMatch: [
		"**/__tests__/unit/**/*.{js,jsx,ts,tsx}", // Look only in the `unit` folder inside `__tests__`
		"**/*.test.{js,jsx,ts,tsx}", // Or files with `.test.js` extension
	],
	testPathIgnorePatterns: [
		"/node_modules/", // Always ignore node_modules
		"__tests__/integration/", // Explicitly ignore the integration tests
		"__tests__/jest/app/integration/old/", // Exclude old integration tests
	],
	// Ensure clean test environment
	clearMocks: true,
	resetMocks: false,
	restoreMocks: true,
	// Add setup file for fetch polyfill
	setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
	// Add more setup options before each test is run
	// setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(config);
