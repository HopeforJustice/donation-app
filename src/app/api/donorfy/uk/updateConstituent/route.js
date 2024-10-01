import { NextResponse } from "next/server";
import sendErrorEmail from "@/app/lib/sendErrorEmail";

export async function POST(req) {
	const { formData, constituentId } = await req.json();

	try {
		const apiKey = req.headers.get("next-api-key");

		if (apiKey !== process.env.NEXT_API_KEY) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Create a base64 encoded "username:password" string for Basic Auth
		const authString = Buffer.from(
			`DonationApp:${process.env.DONORFY_UK_KEY}`
		).toString("base64");

		// Send PUT request to Donorfy to update the constituent
		const donorfyResponse = await fetch(
			`https://data.donorfy.com/api/v1/GO66X0NEL4/constituents/${constituentId}`,
			{
				method: "PUT",
				headers: {
					Authorization: `Basic ${authString}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					FirstName: formData.firstName,
					LastName: formData.lastName,
					AddressLine1: formData.address1,
					AddressLine2: formData.address2,
					Town: formData.townCity,
					PostalCode: formData.postcode,
					Phone1: formData.phone,
				}),
			}
		);

		// If the response is not successful, capture and log the error
		if (!donorfyResponse.ok) {
			const errorMessage = await donorfyResponse.text(); // Capture the error as plain text
			console.error("Failed to update constituent:", errorMessage);

			// Optionally, send an email here as well, if you want to alert on failure immediately
			await sendErrorEmail(new Error(`Donorfy API error: ${errorMessage}`), {
				email: formData.email,
			});

			return NextResponse.json(
				{ error: "Failed to update constituent" },
				{ status: donorfyResponse.status }
			);
		}

		// Return a success message if no issues
		return NextResponse.json(
			{ message: "Constituent updated successfully" },
			{ status: 200 }
		);
	} catch (error) {
		console.error("Error updating constituent:", error);

		return NextResponse.json(
			{ error: "Error updating constituent" },
			{ status: 500 }
		);
	}
}
