// /app/api/debug-env/route.js  (App Router)
// or /pages/api/debug-env.js  (Pages Router)
export async function GET(req) {
	return new Response(
		JSON.stringify({
			DATABASE_URL: process.env.DATABASE_URL,
			// add others here
		}),
		{ status: 200 }
	);
}
