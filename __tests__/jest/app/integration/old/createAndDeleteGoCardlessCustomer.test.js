import { getGoCardlessClient } from "@/app/lib/gocardless/gocardlessclient";
const client = getGoCardlessClient();

describe("Integration: create and delete GoCardless customer", () => {
	it("Should create and delete GC customer", async () => {
		// Test customer in GC
		const customer = await client.customers.create({
			email: "user@example.com",
			given_name: "Frank",
			family_name: "Osborne",
			address_line1: "27 Acer Road",
			address_line2: "Apt 2",
			city: "London",
			postal_code: "E8 3GX",
			country_code: "GB",
			metadata: {
				salesforce_id: "ABCD1234",
			},
		});
		expect(customer.id).toEqual(expect.any(String));
		const deletionResult = await client.customers.remove(customer.id);
		expect(deletionResult).toEqual(expect.any(Object));
		console.log("Result:", deletionResult);
	});
});
