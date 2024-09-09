// /app/api/test/route.js
import { NextResponse } from "next/server";

export async function POST(req) {
	try {
		// Parse the request body to confirm the request is working
		const body = await req.json();

		// Log the received data to ensure the request works
		console.log("Received data:", body);

		// Respond with mock data
		return NextResponse.json({
			message: "API is working!",
			receivedData: body,
		});
	} catch (error) {
		console.error("Error in API:", error);
		return NextResponse.json(
			{ message: "Error processing request" },
			{ status: 500 }
		);
	}
}
