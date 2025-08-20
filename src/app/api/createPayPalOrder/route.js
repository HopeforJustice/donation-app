import { NextResponse } from "next/server";
import { createPayPalOrder } from "@/app/lib/paypal/createPayPalOrder";

export async function POST(req) {
	try {
		const { amount, currency, formData, utmParams } = await req.json();
		const test = process.env.VERCEL_ENV !== "production";
		const mode = test ? "test" : "live";

		// Create PayPal order using lib function
		const { orderID } = await createPayPalOrder({
			amount,
			currency,
			mode,
			formData,
			utmParams,
		});

		return NextResponse.json({
			orderID,
		});
	} catch (error) {
		console.error("Error creating PayPal order:", error);
		return NextResponse.json(
			{ error: error.message || "Failed to create PayPal order" },
			{ status: 500 }
		);
	}
}
