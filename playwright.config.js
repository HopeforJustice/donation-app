const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
	testDir: "./__tests__/playwright", // Specify the folder where Playwright should look for tests
	timeout: 240000, // Set timeout for each test (240 seconds)
	retries: 2, // Retry failed tests in CI
	globalSetup: "./playwright.setup.js",
	use: {
		baseURL: "http://localhost:3000", // Your app's base URL
		headless: false, // Run tests in headless mode
		launchOptions: {
			slowMo: process.env.CI ? 0 : 10, // No delay in CI for faster execution
		},
		viewport: { width: 1800, height: 1000 }, // Set the default browser viewport
		screenshot: "only-on-failure", // Take screenshots on failure
		video: process.env.CI ? "retain-on-failure" : "on-first-retry", // Keep videos only on failure in CI
		trace: process.env.CI ? "retain-on-failure" : "off", // Enable trace collection in CI for debugging
	},
	// Run tests in parallel in CI but limit workers to avoid resource issues
	workers: process.env.CI ? 2 : undefined,
	// Fail the build on CI if any test fails
	forbidOnly: !!process.env.CI,
	// Output more detailed information in CI
	reporter: process.env.CI
		? [["github"], ["html", { outputFolder: "playwright-report" }]]
		: [["html", { outputFolder: "playwright-report" }]],
});
