import { loadStripe } from "@stripe/stripe-js";

export const getStripePromise = ({ currency, mode = "live" }) => {
	let key;

	if (currency === "gbp") {
		key =
			mode === "live"
				? process.env.NEXT_PUBLIC_STRIPE_UK_PUBLISHABLE_KEY_LIVE
				: process.env.NEXT_PUBLIC_STRIPE_UK_PUBLISHABLE_KEY_TEST;
	} else if (currency === "usd") {
		key =
			mode === "live"
				? process.env.NEXT_PUBLIC_STRIPE_US_PUBLISHABLE_KEY_LIVE
				: process.env.NEXT_PUBLIC_STRIPE_US_PUBLISHABLE_KEY_TEST;
	}

	if (!key) {
		throw new Error("Missing Stripe publishable key for currency/mode.");
	}

	return loadStripe(key);
};
