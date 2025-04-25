import { getStripeInstance } from "@/app/lib/stripe/getStripeInstance";

export async function POST(req) {
	const body = await req.json();

	const {
		amount,
		currency = "gbp",
		stripeMode = "live",
		email,
		campaign,
		projectId,
		givingTo,
		title,
		firstName,
		lastName,
		phone,
		address1,
		address2,
		postcode,
		country,
		stateCounty = null,
		townCity,
		giftAid,
		emailPreference,
		postPreference,
		smsPreference,
		phonePreference,
		inspirationQuestion,
		inspirationDetails,
		donorType,
		organisationName,
	} = body;

	const formattedGivingTo = decodeURIComponent(givingTo);

	const origin = req.headers.get("origin");
	const fullUrl = new URL(req.url);
	const amountInMinor = Math.round(amount * 100);
	let bankTransferType = null;

	let productDataName = "Donation";
	if (campaign === "FreedomFoundation") {
		productDataName = `Donation to ${givingTo}`;
		bankTransferType = getBankTransferType(currency);
	}

	const stripe = getStripeInstance({ currency, mode: stripeMode });

	const donorfyInstance = currency === "gbp" ? "uk" : "us";

	const customer = await stripe.customers.create({ email });

	const base = {
		customer: customer.id,
		line_items: [
			{
				price_data: {
					currency: currency,
					product_data: { name: productDataName },
					unit_amount: amountInMinor,
				},
				quantity: 1,
			},
		],
		mode: "payment",
		success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
		// cancel_url: `${origin}/`,
		payment_method_types: ["card"],
		payment_intent_data: {
			metadata: {
				campaign,
				projectId,
				source: "donation app",
				givingTo: formattedGivingTo,
				title,
				firstName,
				lastName,
				phone,
				address1,
				address2,
				postcode,
				country,
				townCity,
				giftAid,
				emailPreference,
				postPreference,
				smsPreference,
				phonePreference,
				inspirationQuestion,
				inspirationDetails,
				donorfyInstance,
				stateCounty,
				donorType,
				organisationName,
			},
		},
	};

	// Add bank transfer if supported
	if (bankTransferType) {
		base.payment_method_types.push("customer_balance");
		base.payment_method_options = {
			customer_balance: {
				funding_type: "bank_transfer",
				bank_transfer: {
					type: bankTransferType,
				},
			},
		};
	}

	const session = await stripe.checkout.sessions.create(base);
	console.log(JSON.stringify(base));

	return Response.json({ sessionId: session.id });
}

function getBankTransferType(currency) {
	switch (currency.toLowerCase()) {
		case "usd":
			return "us_bank_transfer";
		case "gbp":
			return "gb_bank_transfer";
		case "aud":
			return "au_bank_transfer";
		default:
			return null;
	}
}
