import Stripe from "stripe";

export function getStripeInstance({ currency, mode = "test" }) {
	let secretKey;

	if (currency === "gbp") {
		secretKey =
			mode === "live"
				? process.env.STRIPE_UK_SECRET_KEY_LIVE
				: process.env.STRIPE_UK_SECRET_KEY_TEST;
	} else if (currency === "usd") {
		secretKey =
			mode === "live"
				? process.env.STRIPE_US_SECRET_KEY_LIVE
				: process.env.STRIPE_US_SECRET_KEY_TEST;
	}

	if (!secretKey) {
		throw new Error(
			"Stripe secret key not found for the selected region/mode."
		);
	}

	return new Stripe(secretKey, {
		apiVersion: "2023-10-16",
	});
}
