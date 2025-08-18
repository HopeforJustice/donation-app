/**
 * Helper function to advance a Stripe test clock
 * @param {string} testClockId - The ID of the test clock to advance
 * @param {string} currency - The currency (gbp or usd)
 * @param {string|number} advanceBy - How much to advance ('month', 'week', 'day', or seconds)
 * @returns {Promise<Object>} The response from the advance operation
 */
export default async function advanceTestClock(
	testClockId,
	currency,
	advanceBy
) {
	const response = await fetch(
		`${process.env.NEXT_PUBLIC_API_URL}/api/advanceTestClock`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				testClockId,
				currency,
				advanceBy,
			}),
		}
	);

	if (!response.ok) {
		const error = await response.json();
		throw new Error(`Failed to advance test clock: ${error.error}`);
	}

	return await response.json();
}
