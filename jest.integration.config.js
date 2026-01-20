const nextJest = require("next/jest");

/** @type {import('jest').Config} */
const createJestConfig = nextJest({
	// Provide the path to your Next.js app to load next.config.js and .env files in your test environment
	dir: "./",
});

// Add any custom config to be passed to Jest
const config = {
	coverageProvider: "v8",
	testEnvironment: "node", // Integration tests need node environment
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/src/$1",
		"^@tests/(.*)$": "<rootDir>/__tests__/$1",
	},
	collectCoverage: false,
	testMatch: [
		"**/__tests__/jest/app/integration/**/*.{js,jsx,ts,tsx}", // Only integration tests
	],
	testPathIgnorePatterns: [
		"/node_modules/", // Always ignore node_modules
		"__tests__/jest/app/integration/old/", // Exclude old integration tests
	],
	testTimeout: 30000, // 30 seconds for integration tests
	// Ensure clean test environment
	clearMocks: true,
	resetMocks: false,
	restoreMocks: true,
	// Add setup file for fetch polyfill
	setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(config);
