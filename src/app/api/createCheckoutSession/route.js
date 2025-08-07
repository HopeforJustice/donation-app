import { getStripeInstance } from "@/app/lib/stripe/getStripeInstance";
import { NextResponse } from "next/server";

export async function POST(req) {
	//will need to change this to be dynamic
	const stripe = getStripeInstance({ currency: "gbp", mode: "test" });
	const body = await req.json();
	const amount = body.amount * 100;
	const session = await stripe.checkout.sessions.create({
		ui_mode: "custom",
		line_items: [
			{
				price_data: {
					currency: "gbp",
					product_data: { name: "donation" },
					unit_amount: amount,
				},
				quantity: 1,
			},
		],
		mode: "payment",
		return_url: `https://localhost:3000/complete?session_id={CHECKOUT_SESSION_ID}`,
	});
	// console.log("clientSecret:", session.client_secret);
	console.log("session total", session.amount_total);

	return NextResponse.json({ clientSecret: session.client_secret });
}
