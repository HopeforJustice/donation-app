const gocardless = require("gocardless-nodejs");
const constants = require("gocardless-nodejs/constants");

export const getGoCardlessClient = () => {
	return gocardless(
		process.env.GOCARDLESS_ENVIRONMENT === "live"
			? process.env.GOCARDLESS_ACCESS_TOKEN_LIVE
			: process.env.GOCARDLESS_ACCESS_TOKEN_SANDBOX,
		process.env.GOCARDLESS_ENVIRONMENT === "live"
			? constants.Environments.Live
			: constants.Environments.Sandbox
	);
};
