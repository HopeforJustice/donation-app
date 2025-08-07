const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
	testDir: "./__tests__/playwright", // Specify the folder where Playwright should look for tests
	timeout: 60000, // Set timeout for each test (120 seconds)
	retries: 0, // Number of retries for failed tests
	globalSetup: "./playwright.setup.js",
	use: {
		baseURL: "http://localhost:3000", // Your app's base URL
		headless: false, // Run tests in headless mode
		launchOptions: {
			slowMo: 100, // Add a slight delay between actions for better observation
		},
		viewport: { width: 1800, height: 1000 }, // Set the default browser viewport
		screenshot: "only-on-failure", // Take screenshots on failure
		video: "on-first-retry", // Record video on the first retry
	},
});
