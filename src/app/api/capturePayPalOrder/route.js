import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { capturePayPalOrder } from "@/app/lib/paypal/capturePayPalOrder";

export async function POST(req) {
	try {
		const { orderID, formData } = await req.json();
		const test = process.env.VERCEL_ENV !== "production";
		const mode = test ? "test" : "live";
		const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

		// Capture PayPal order
		const captureResult = await capturePayPalOrder({
			orderID,
			mode,
			formData,
		});

		// Process donation to Donorfy asynchronously
		const backgroundTask = fetch(`${apiUrl}/api/processPayPalDonation`, {
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
		}).catch((error) => {
			// Log error but don't fail the user's payment
			console.error("Failed to initiate background Donorfy processing:", error);
		});

		// waitUntil to ensure the background task completes
		waitUntil(backgroundTask);

		return NextResponse.json(captureResult);
	} catch (error) {
		console.error("Error capturing PayPal order:", error);
		return NextResponse.json(
			{ error: error.message || "Failed to capture PayPal order" },
			{ status: 500 }
		);
	}
}
