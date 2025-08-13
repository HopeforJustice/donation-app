import { getStripeInstance } from "@/app/lib/stripe/getStripeInstance";
import { NextResponse } from "next/server";

export async function POST(req) {
	const test = process.env.VERCEL_ENV !== "production";
	const ukLive = process.env.NEXT_PUBLIC_STRIPE_UK_PUBLISHABLE_KEY_LIVE;
	const ukTest = process.env.NEXT_PUBLIC_STRIPE_UK_PUBLISHABLE_KEY_TEST;
	const usLive = process.env.NEXT_PUBLIC_STRIPE_US_PUBLISHABLE_KEY_LIVE;
	const usTest = process.env.NEXT_PUBLIC_STRIPE_US_PUBLISHABLE_KEY_TEST;
	let publishableKey;
	let paymentMethods;

	const body = await req.json();
	const { currency, amount, givingFrequency, metadata } = body;

	const stripe = getStripeInstance({
		currency,
		mode: test ? "test" : "live",
	});

	if (currency === "gbp") {
		publishableKey = test ? ukTest : ukLive;
		paymentMethods = ["card", "pay_by_bank"];
	} else if (currency === "usd") {
		publishableKey = test ? usTest : usLive;
		paymentMethods = ["card", "cashapp"];
	} else {
		return NextResponse.json(
			{ error: "Unsupported currency" },
			{ status: 400 }
		);
	}

	const amountInCents = Math.round(Number(amount) * 100);

	// Decide mode and price_data
	let sessionMode;
	let priceData = {
		currency,
		product_data: { name: "donation" },
		unit_amount: amountInCents,
	};

	if (givingFrequency === "monthly") {
		sessionMode = "subscription";
		priceData.recurring = {
			interval: "month",
		};
	} else {
		sessionMode = "payment";
	}

	const session = await stripe.checkout.sessions.create({
		ui_mode: "custom",
		line_items: [
			{
				price_data: priceData,
				quantity: 1,
			},
		],
		mode: sessionMode,
		return_url: `http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}`,
		payment_method_types: paymentMethods,
		metadata,
		...(sessionMode === "payment" && {
			payment_intent_data: {
				metadata: metadata,
			},
		}),
		...(sessionMode === "subscription" && {
			subscription_data: {
				metadata: metadata,
			},
		}),
	});

	// console.log("Checkout session created:", session);

	return NextResponse.json({
		clientSecret: session.client_secret,
		publishableKey,
	});
}
