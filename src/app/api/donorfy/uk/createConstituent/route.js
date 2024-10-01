import { NextResponse } from "next/server";
import sendErrorEmail from "@/app/lib/sendErrorEmail";

export async function POST(req) {
	const formData = await req.json();

	try {
		const apiKey = req.headers.get("next-api-key");

		if (apiKey !== process.env.NEXT_API_KEY) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Create a base64 encoded "username:password" string for Basic Auth
		const authString = Buffer.from(
			`DonationApp:${process.env.DONORFY_UK_KEY}`
		).toString("base64");

		// Send data to Donorfy
		const donorfyResponse = await fetch(
			`https://data.donorfy.com/api/v1/GO66X0NEL4/constituents/`,
			{
				method: "POST",
				headers: {
					Authorization: `Basic ${authString}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					ConstituentType: "individual",
					FirstName: formData.firstName,
					LastName: formData.lastName,
					AddressLine1: formData.address1,
					AddressLine2: formData.address2,
					Town: formData.townCity,
					PostalCode: formData.postcode,
					EmailAddress: formData.email,
					Phone1: formData.phone,
					RecruitmentCampaign: formData.campaign,
				}),
			}
		);

		if (!donorfyResponse.ok) {
			console.error(
				"Failed to create constituent",
				await donorfyResponse.text()
			);
		}

		return NextResponse.json(
			{
				message: "constituent created",
				response: await donorfyResponse.json(),
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error("Error creating constituent:", error);

		return NextResponse.json(
			{ error: "Error creating constituent" },
			{ status: 500 }
		);
	}
}
