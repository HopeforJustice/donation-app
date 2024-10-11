import { sql } from "@vercel/postgres";

export default async function handleCustomer(
	constituentId,
	donorfyInstance,
	alreadyInDonorfy,
	constituentNumber
) {
	try {
		const existingCustomer = await sql`
        SELECT id FROM customers WHERE donorfy_constituent_id = ${constituentId};
      `;

		if (existingCustomer.rows.length > 0) {
			return {
				message: "Customer found",
				customerId: existingCustomer.rows[0].id,
			};
		}

		const newCustomer = await sql`
        INSERT INTO customers (
          donorfy_constituent_id,
          donorfy_constituent_number,
          donorfy_instance,
          already_in_donorfy,
          created_at,
          updated_at
        )
        VALUES (
          ${constituentId},
          ${constituentNumber},
          ${donorfyInstance},
          ${alreadyInDonorfy},
          NOW(),
          NOW()
        )
        RETURNING id;
      `;

		return {
			message: "New customer created",
			customerId: newCustomer.rows[0].id,
		};
	} catch (error) {
		throw new Error("Error handling customer:", error);
	}
}
