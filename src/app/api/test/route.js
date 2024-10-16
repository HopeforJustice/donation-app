// /app/api/test/route.js
import { NextResponse } from "next/server";
import { deleteActiveTag } from "@/app/lib/donorfy/deleteActiveTag";

export async function POST() {
	try {
		const constituentId = "0bb020b8-b58b-ef11-a81c-002248a0dee1";
		const tag = "Gocardless_Active Subscription";

		const data = await deleteActiveTag(tag, constituentId, "uk");

		if (data.success) {
			return NextResponse.json({ message: "success" }, { status: 200 });
		} else {
			return NextResponse.json(
				{ message: "Error processing request" },
				{ status: 500 }
			);
		}
	} catch (error) {
		console.error("Error in API:", error);
		return NextResponse.json(
			{ message: "Error processing request" },
			{ status: 500 }
		);
	}
}
