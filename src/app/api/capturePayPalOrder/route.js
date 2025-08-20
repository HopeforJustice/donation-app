import { NextResponse } from "next/server";
import { capturePayPalOrder } from "@/app/lib/paypal/capturePayPalOrder";

export async function POST(req) {
	try {
		const { orderID, formData, utmParams } = await req.json();
		const test = process.env.VERCEL_ENV !== "production";
		const mode = test ? "test" : "live";

		// Capture PayPal order
		const captureResult = await capturePayPalOrder({
			orderID,
			mode,
			formData,
			utmParams,
		});

		// Process donation to Donorfy asynchronously via API call

		fetch(
			`${
				process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
			}/api/processPayPalDonation`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					orderID,
					captureID: captureResult.captureID,
					amount: captureResult.paymentDetails.amount,
					formData,
					mode,
				}),
			}
		).catch((error) => {
			// Log error but don't fail the user's payment
			console.error("Failed to initiate background Donorfy processing:", error);
		});

		return NextResponse.json(captureResult);
	} catch (error) {
		console.error("Error capturing PayPal order:", error);
		return NextResponse.json(
			{ error: error.message || "Failed to capture PayPal order" },
			{ status: 500 }
		);
	}
}
