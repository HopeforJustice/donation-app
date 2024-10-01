import { NextResponse } from "next/server";
import sendErrorEmail from "@/app/lib/sendErrorEmail";

export async function POST(req) {
	try {
		// Intentionally throw error to simulate a failure
		throw new Error("This is a test error for sending emails");
	} catch (error) {
		console.error("Caught test error:", error);

		const testVar = "testing var";

		// Send error email
		await sendErrorEmail(error, {
			name: "testing name",
			other: "testing other",
			testVar: testVar,
		});

		return NextResponse.json({ message: "Error email sent" }, { status: 500 });
	}
}
