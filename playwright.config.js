const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
	testDir: "./__tests__/integration", // Specify the folder where Playwright should look for tests
	timeout: 30000, // Set timeout for each test (30 seconds)
	retries: 1, // Retry failed tests once
	use: {
		baseURL: "http://localhost:3000", // Your app's base URL
		headless: false, // Run tests in headless mode
		launchOptions: {
			slowMo: 50, // Add a slight delay between actions for better observation
		},
		viewport: { width: 1800, height: 1000 }, // Set the default browser viewport
		screenshot: "only-on-failure", // Take screenshots on failure
		video: "on-first-retry", // Record video on the first retry
	},
});
