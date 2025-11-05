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
	const { currency, amount, givingFrequency, metadata, allowedPaymentMethods } =
		body;

	const stripe = getStripeInstance({
		currency,
		mode: test ? "test" : "live",
	});

	// Using UK stripe for NOK and UK
	if (currency === "gbp") {
		publishableKey = test ? ukTest : ukLive;
		if (
			allowedPaymentMethods &&
			Array.isArray(allowedPaymentMethods) &&
			allowedPaymentMethods.length > 0
		) {
			paymentMethods = allowedPaymentMethods;
		} else {
			paymentMethods = ["card", "pay_by_bank", "customer_balance"];
		}
	} else if (currency === "usd") {
		publishableKey = test ? usTest : usLive;
		paymentMethods = ["card"];
	} else if (currency === "nok") {
		publishableKey = test ? ukTest : ukLive;
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

	// Check if customer_balance payment method is being used
	const needsCustomer = paymentMethods.includes("customer_balance");

	// For test environment, create a test clock for time simulation
	let testClockId = null;
	let customer = null;

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
			customer = await stripe.customers.create({
				test_clock: testClockId,
				metadata: {
					...metadata,
					test_clock_id: testClockId,
					created_for: sessionMode,
				},
			});
			console.log(`Created test customer with test clock: ${customer.id}`);
		} catch (error) {
			console.warn(
				"Failed to create test clock/customer, proceeding without it:",
				error.message
			);
		}
	} else if (needsCustomer && !test) {
		// For production, create a customer when using customer_balance
		try {
			customer = await stripe.customers.create({
				metadata: {
					...metadata,
					created_for: sessionMode,
				},
			});
			console.log(`Created customer for customer_balance: ${customer.id}`);
		} catch (error) {
			console.error("Failed to create customer:", error.message);
			return NextResponse.json(
				{ error: "Failed to create customer for bank transfer payment" },
				{ status: 500 }
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
		return_url: `${baseurl}/success?currency=${currency}&amount=${amount}&gateway=stripe&frequency=${givingFrequency}&session_id={CHECKOUT_SESSION_ID}`,
		payment_method_types: paymentMethods,
		...(currency === "gbp" && {
			payment_method_options: {
				customer_balance: {
					funding_type: "bank_transfer",
					bank_transfer: { type: "gb_bank_transfer" },
				},
			},
		}),
		metadata: {
			...metadata,
			...(testClockId && { test_clock_id: testClockId }),
		},
		...(customer && { customer: customer.id }),
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
			testCustomerId: customer?.id,
			testClockFrozenTime: Math.floor(Date.now() / 1000),
		}),
	});
}
