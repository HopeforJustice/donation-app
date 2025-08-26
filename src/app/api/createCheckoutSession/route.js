import { getStripeInstance } from "@/app/lib/stripe/getStripeInstance";
import { NextResponse } from "next/server";

export async function POST(req) {
	const test = process.env.VERCEL_ENV !== "production";
	const ukLive = process.env.NEXT_PUBLIC_STRIPE_UK_PUBLISHABLE_KEY_LIVE;
	const ukTest = process.env.NEXT_PUBLIC_STRIPE_UK_PUBLISHABLE_KEY_TEST;
	const usLive = process.env.NEXT_PUBLIC_STRIPE_US_PUBLISHABLE_KEY_LIVE;
	const usTest = process.env.NEXT_PUBLIC_STRIPE_US_PUBLISHABLE_KEY_TEST;
	const baseurl = process.env.NEXT_PUBLIC_API_URL;
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
		paymentMethods = ["card"];
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

	// For test environment, create a test clock for time simulation
	let testClockId = null;
	let testCustomer = null;
	if (test) {
		try {
			// Create test clock with current time as frozen_time
			const testClock = await stripe.testHelpers.testClocks.create({
				frozen_time: Math.floor(Date.now() / 1000),
				name: `Donation Test Clock ${new Date().toISOString()}`,
			});
			testClockId = testClock.id;
			console.log(`Created test clock: ${testClockId}`);

			// Create a customer with the test clock
			// This associates all future operations with this customer to the test clock
			testCustomer = await stripe.customers.create({
				test_clock: testClockId,
				metadata: {
					...metadata,
					test_clock_id: testClockId,
					created_for: sessionMode,
				},
			});
			console.log(`Created test customer with test clock: ${testCustomer.id}`);
		} catch (error) {
			console.warn(
				"Failed to create test clock/customer, proceeding without it:",
				error.message
			);
		}
	}

	const sessionConfig = {
		ui_mode: "custom",
		line_items: [
			{
				price_data: priceData,
				quantity: 1,
			},
		],
		mode: sessionMode,
		return_url: `${baseurl}/success?session_id={CHECKOUT_SESSION_ID}`,
		payment_method_types: paymentMethods,
		metadata: {
			...metadata,
			...(testClockId && { test_clock_id: testClockId }),
		},
		...(testCustomer && { customer: testCustomer.id }),
		...(sessionMode === "payment" && {
			payment_intent_data: {
				metadata: {
					...metadata,
					...(testClockId && { test_clock_id: testClockId }),
				},
			},
		}),
		...(sessionMode === "subscription" && {
			subscription_data: {
				metadata: {
					...metadata,
					...(testClockId && { test_clock_id: testClockId }),
				},
			},
		}),
	};

	const session = await stripe.checkout.sessions.create(sessionConfig);

	// console.log("Checkout session created:", session);

	return NextResponse.json({
		clientSecret: session.client_secret,
		publishableKey,
		...(testClockId && {
			testClockId,
			testCustomerId: testCustomer?.id,
			testClockFrozenTime: Math.floor(Date.now() / 1000),
		}),
	});
}
