import { getStripeInstance } from "@/app/lib/stripe/getStripeInstance";
import { NextResponse } from "next/server";

export async function POST(req) {
	const test = process.env.VERCEL_ENV !== "production";
	
	// Only allow in test mode
	if (!test) {
		return NextResponse.json(
			{ error: "Test clock advancement only available in test mode" },
			{ status: 400 }
		);
	}

	const body = await req.json();
	const { testClockId, currency, advanceBy } = body;

	if (!testClockId) {
		return NextResponse.json(
			{ error: "testClockId is required" },
			{ status: 400 }
		);
	}

	const stripe = getStripeInstance({
		currency,
		mode: "test",
	});

	try {
		// First, get the current clock state
		const currentClock = await stripe.testHelpers.testClocks.retrieve(testClockId);
		
		// Calculate new time based on advancement type
		let newFrozenTime;
		if (advanceBy === "month") {
			// Advance by 1 month (30 days)
			newFrozenTime = currentClock.frozen_time + (30 * 24 * 60 * 60);
		} else if (advanceBy === "week") {
			// Advance by 1 week
			newFrozenTime = currentClock.frozen_time + (7 * 24 * 60 * 60);
		} else if (advanceBy === "day") {
			// Advance by 1 day
			newFrozenTime = currentClock.frozen_time + (24 * 60 * 60);
		} else if (typeof advanceBy === "number") {
			// Advance by specific number of seconds
			newFrozenTime = currentClock.frozen_time + advanceBy;
		} else {
			return NextResponse.json(
				{ error: "Invalid advanceBy parameter. Use 'month', 'week', 'day', or number of seconds" },
				{ status: 400 }
			);
		}

		// Advance the test clock
		const advancedClock = await stripe.testHelpers.testClocks.advance(testClockId, {
			frozen_time: newFrozenTime,
		});

		console.log(`Advanced test clock ${testClockId} from ${currentClock.frozen_time} to ${newFrozenTime}`);

		return NextResponse.json({
			success: true,
			testClockId: advancedClock.id,
			previousTime: currentClock.frozen_time,
			newTime: advancedClock.frozen_time,
			status: advancedClock.status,
		});
	} catch (error) {
		console.error("Failed to advance test clock:", error);
		return NextResponse.json(
			{ error: `Failed to advance test clock: ${error.message}` },
			{ status: 500 }
		);
	}
}
