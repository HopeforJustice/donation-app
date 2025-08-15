import { poll } from "@/app/lib/utilities";
import DonorfyClient from "@/app/lib/donorfy/donorfyClient";

const donorfyUK = new DonorfyClient(
	process.env.DONORFY_UK_KEY,
	process.env.DONORFY_UK_TENANT
);
const donorfyUS = new DonorfyClient(
	process.env.DONORFY_US_KEY,
	process.env.DONORFY_US_TENANT
);

export default async function pollForTransaction(
	constituentId,
	donorfyInstance,
	expectedAmount = null
) {
	console.log(
		`polling for transaction for constituent: ${constituentId} in ${donorfyInstance}`
	);
	const donorfy = donorfyInstance === "us" ? donorfyUS : donorfyUK;

	return await poll(
		async () => {
			try {
				const transactions = await donorfy.getConstituentTransactions(
					constituentId
				);

				if (
					transactions &&
					transactions.TransactionsList &&
					transactions.TransactionsList.length > 0
				) {
					// Sort by date to get the most recent
					const sortedTransactions = transactions.TransactionsList.sort(
						(a, b) => new Date(b.Date) - new Date(a.Date)
					);

					const latestTransaction = sortedTransactions[0];

					// If we're looking for a specific amount, check it matches
					if (expectedAmount !== null) {
						if (Math.abs(latestTransaction.Amount - expectedAmount) < 0.01) {
							console.log(
								`Found matching transaction: ${latestTransaction.Id}, amount: ${latestTransaction.Amount}`
							);
							return latestTransaction;
						}
						// If amount doesn't match, continue polling
						return null;
					}

					console.log(
						`Found transaction: ${latestTransaction.Id}, amount: ${latestTransaction.Amount}`
					);
					return latestTransaction;
				}
			} catch (err) {
				console.error("Error polling for transaction:", err);
				throw err;
			}
			return null;
		},
		{ interval: 500, timeout: 60000 }
	);
}
