import { NextResponse } from "next/server";

export async function POST(req) {
	try {
		const apiKey = req.headers.get("next-api-key");

		if (apiKey !== process.env.NEXT_API_KEY) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { email } = await req.json();

		console.log(email);

		// Create a base64 encoded "username:password" string for Basic Auth
		const authString = Buffer.from(
			`DonationApp:${process.env.DONORFY_UK_KEY}`
		).toString("base64");

		// Send data to Donorfy
		const donorfyResponse = await fetch(
			`https://data.donorfy.com/api/v1/GO66X0NEL4/constituents/DuplicateCheckPerson`,
			{
				method: "POST",
				headers: {
					Authorization: `Basic ${authString}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					EmailAddress: email,
				}),
			}
		);

		if (!donorfyResponse.ok) {
			console.error(
				"Failed to send data to CRM:",
				await donorfyResponse.text()
			);
		}

		return NextResponse.json(
			{
				message: "Duplicate check successful",
				response: await donorfyResponse.json(),
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error("Error processing duplicate check webhook:", error);
		return NextResponse.json(
			{ error: "Duplicate check processing failed" },
			{ status: 500 }
		);
	}
}
