export default function getDonorfyCredentials(instance) {
	if (instance === "uk") {
		return {
			apiKey: process.env.DONORFY_UK_KEY,
			tenant: process.env.DONORFY_UK_TENANT,
		};
	} else {
		throw new Error("Unsupported Donorfy instance");
	}
}
