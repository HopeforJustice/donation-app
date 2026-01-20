/**
 * Helper utilities for cleaning up Donorfy test data
 */

/**
 * Clean up test constituents from Donorfy
 * @param {Array<string>} constituentIds - Array of constituent IDs to delete
 * @param {string} donorfyInstance - Either "uk" or "us"
 */
export async function cleanupTestConstituents(
	constituentIds,
	donorfyInstance = "uk",
) {
	if (!constituentIds || constituentIds.length === 0) {
		return;
	}

	const { getDonorfyClient } = await import("@/app/lib/utils");
	const donorfy = getDonorfyClient(donorfyInstance);

	for (const constituentId of constituentIds) {
		try {
			await donorfy.deleteConstituent(constituentId);
			console.log(`✅ Cleaned up test constituent: ${constituentId}`);
		} catch (error) {
			console.warn(
				`⚠️ Failed to cleanup test constituent ${constituentId}: ${error.message}`,
			);
		}
	}
}

/**
 * Test constituent tracker - helps manage cleanup across tests
 */
export class TestConstituentTracker {
	constructor(donorfyInstance = "uk") {
		this.constituentIds = [];
		this.donorfyInstance = donorfyInstance;
	}

	/**
	 * Add a constituent ID to track for cleanup
	 * @param {string} constituentId
	 */
	track(constituentId) {
		if (constituentId && !this.constituentIds.includes(constituentId)) {
			this.constituentIds.push(constituentId);
		}
	}

	/**
	 * Clean up all tracked constituents
	 */
	async cleanup() {
		await cleanupTestConstituents(this.constituentIds, this.donorfyInstance);
		this.constituentIds = []; // Clear the array after cleanup
	}

	/**
	 * Get the number of tracked constituents
	 */
	get count() {
		return this.constituentIds.length;
	}
}
