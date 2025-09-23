// app/api/test/route.js
import { NextResponse } from "next/server";

export async function POST() {
	try {
		const data = "test";

		return NextResponse.json(data, { status: 200 });
	} catch (error) {
		console.error("Error in API:", error);
		return NextResponse.json(
			{ message: "Error processing request" },
			{ status: 500 }
		);
	}
}
