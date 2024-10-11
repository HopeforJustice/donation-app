// /app/api/test/route.js
import { NextResponse } from "next/server";
import { duplicateCheck } from "@/app/lib/donorfy/duplicateCheck";

export async function POST() {
	try {
		const response = await duplicateCheck(
			"james.holt@hopeforjustice.org",
			"uk"
		);

		return NextResponse.json({ response: response }, { status: 200 });
	} catch (error) {
		console.error("Error in API:", error);
		return NextResponse.json(
			{ message: "Error processing request" },
			{ status: 500 }
		);
	}
}
