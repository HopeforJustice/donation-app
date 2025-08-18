// Health check endpoint for CI/CD
export async function GET() {
	try {
		// Basic health check - you can add database connectivity check here if needed
		return new Response(
			JSON.stringify({
				status: "healthy",
				timestamp: new Date().toISOString(),
				environment: process.env.NODE_ENV || "development",
			}),
			{
				status: 200,
				headers: {
					"Content-Type": "application/json",
				},
			}
		);
	} catch (error) {
		return new Response(
			JSON.stringify({
				status: "unhealthy",
				error: error.message,
				timestamp: new Date().toISOString(),
			}),
			{
				status: 500,
				headers: {
					"Content-Type": "application/json",
				},
			}
		);
	}
}
