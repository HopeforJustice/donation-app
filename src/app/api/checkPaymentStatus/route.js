import { getStripeInstance } from "@/app/lib/stripe/getStripeInstance";
import { NextResponse } from "next/server";

export async function GET(req) {
	const { searchParams } = new URL(req.url);
	const sessionId = searchParams.get("session_id");

	if (!sessionId) {
		return NextResponse.json({ isStripe: false });
	}

	try {
		// Determine which Stripe account by trying each one
		const test = process.env.VERCEL_ENV !== "production";

		// Try UK first, then US
		const stripeConfigs = [
			{ currency: "gbp", mode: test ? "test" : "live" },
			{ currency: "usd", mode: test ? "test" : "live" },
		];

		let session = null;
		let stripeInstance = null;

		for (const config of stripeConfigs) {
			try {
				stripeInstance = getStripeInstance(config);
				session = await stripeInstance.checkout.sessions.retrieve(sessionId, {
					expand: [
						"payment_intent",
						"subscription",
						"payment_intent.payment_method",
					],
				});
				break; // Found it!
			} catch (error) {
				// Session not found in this account, try next
				continue;
			}
		}

		if (!session) {
			throw new Error("Session not found in any Stripe account");
		}

		// Check payment status based on mode
		if (session.mode === "payment") {
			const paymentIntent = session.payment_intent;
			return NextResponse.json({
				status: paymentIntent.status,
				paymentMethod: paymentIntent.payment_method?.type,
				amount: paymentIntent.amount,
				currency: paymentIntent.currency,
				isSuccessful: paymentIntent.status === "succeeded",
				requiresAction: paymentIntent.status === "requires_action",
				isPending: ["processing", "requires_action"].includes(
					paymentIntent.status
				),
			});
		} else if (session.mode === "subscription") {
			const subscription = session.subscription;
			return NextResponse.json({
				status: subscription.status,
				amount: session.amount_total,
				currency: session.currency,
				isSuccessful: ["active", "trialing"].includes(subscription.status),
				requiresAction: subscription.status === "incomplete",
				isPending: ["incomplete", "past_due"].includes(subscription.status),
			});
		}
	} catch (error) {
		console.error("Error checking Stripe payment status:", error);
		return NextResponse.json({
			error: error.message,
			isStripe: true,
		});
	}
}
