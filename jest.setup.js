// Jest setup file to configure test environment

// Setup globals for Node.js test environment
if (typeof global.TextEncoder === "undefined") {
	const { TextEncoder, TextDecoder } = require("util");
	global.TextEncoder = TextEncoder;
	global.TextDecoder = TextDecoder;
}

// Setup fetch using whatwg-fetch (simpler approach)
if (typeof global.fetch === "undefined") {
	require("whatwg-fetch");
}
