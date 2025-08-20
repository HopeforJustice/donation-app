import { NextResponse } from "next/server";
import DonorfyClient from "@/app/lib/donorfy/donorfyClient";
import storeWebhookEvent from "@/app/lib/db/storeWebhookEvent";

const donorfyUK = new DonorfyClient(
	process.env.DONORFY_UK_KEY,
	process.env.DONORFY_UK_TENANT
);
const donorfyUS = new DonorfyClient(
	process.env.DONORFY_US_KEY,
	process.env.DONORFY_US_TENANT
);

function getDonorfyClient(instance) {
	return instance === "us" ? donorfyUS : donorfyUK;
}

export async function POST(req) {
	const results = [];
	let currentStep = "";
	let constituentId = null;
	let alreadyInDonorfy = false;
	let donorfyInstance;
	let test = process.env.VERCEL_ENV !== "production";

	try {
		const { orderID, captureID, amount, formData, mode } = await req.json();

		// Validate required data
		if (!orderID || !captureID || !amount || !formData) {
			return NextResponse.json(
				{ error: "Missing required donation data" },
				{ status: 400 }
			);
		}

		console.log(`Processing PayPal donation Order: ${orderID}`);

		currentStep = "Initialize Donorfy client";
		//donorfy determined by currency
		donorfyInstance = formData.currency === "usd" ? "us" : "uk";
		const donorfy = getDonorfyClient(donorfyInstance);
		results.push({ step: currentStep, success: true });

		// Check for a duplicate in Donorfy via email lookup
		currentStep = "Check for duplicate in Donorfy";
		const duplicateCheckData = await donorfy.duplicateCheck({
			EmailAddress: formData.email,
		});
		results.push({ step: currentStep, success: true });

		//Possibly create new constituent
		if (duplicateCheckData.length > 0 && duplicateCheckData[0].Score >= 15) {
			currentStep = "Retrieve Constituent";
			constituentId = duplicateCheckData[0].ConstituentId;
			alreadyInDonorfy = true;
			results.push({ step: currentStep, success: true });
		} else {
			currentStep = "Create new constituent in Donorfy";
			const createConstituentInputData = {
				ConstituentType: "individual",
				Title: formData.title || "",
				FirstName: formData.firstName || "",
				LastName: formData.lastName || "",
				AddressLine1: formData.address1 || "",
				AddressLine2: formData.address2 || "",
				Town: formData.townCity || "",
				PostalCode: formData.postcode || "",
				EmailAddress: formData.email || "",
				Phone1: formData.phone || "",
				RecruitmentCampaign: formData.campaign || "",
				County: donorfyInstance === "us" ? formData.stateCounty : "",
			};
			const createConstituentData = await donorfy.createConstituent(
				createConstituentInputData
			);
			constituentId = createConstituentData.ConstituentId;
			results.push({ step: currentStep, success: true });
		}

		//possibly update the constituent if found
		if (alreadyInDonorfy) {
			currentStep = "Update existing constituent details";
			const updateConstituentInputData = {
				Title: formData.title || "",
				FirstName: formData.firstName || "",
				LastName: formData.lastName || "",
				AddressLine1: formData.address1 || "",
				AddressLine2: formData.address2 || "",
				Town: formData.townCity || "",
				PostalCode: formData.postcode || "",
				EmailAddress: formData.email || "",
				Phone1: formData.phone || "",
				RecruitmentCampaign: formData.campaign || "",
				County:
					donorfyInstance === "us"
						? formData.state || ""
						: formData.stateCounty || "",
			};
			await donorfy.updateConstituent(
				constituentId,
				updateConstituentInputData
			);
			results.push({ step: currentStep, success: true });
		}

		//update preferences | set all to true if US instance
		currentStep = "Update constituent preferences";
		const updatePreferencesData = {
			PreferencesList: [
				{
					PreferenceType: "Channel",
					PreferenceName: "Email",
					PreferenceAllowed:
						donorfyInstance === "us" ? true : formData.emailPreference,
				},
				{
					PreferenceType: "Channel",
					PreferenceName: "Mail",
					PreferenceAllowed:
						donorfyInstance === "us" ? true : formData.postPreference,
				},
				{
					PreferenceType: "Channel",
					PreferenceName: "Phone",
					PreferenceAllowed:
						donorfyInstance === "us" ? true : formData.phonePreference,
				},
				{
					PreferenceType: "Channel",
					PreferenceName: "SMS",
					PreferenceAllowed:
						donorfyInstance === "us" ? true : formData.smsPreference,
				},
				{
					PreferenceType: "Purpose",
					PreferenceName: "Email Updates",
					PreferenceAllowed:
						donorfyInstance === "us" ? true : formData.emailPreference,
				},
			],
		};
		await donorfy.updateConstituentPreferences(
			constituentId,
			updatePreferencesData
		);
		results.push({ step: currentStep, success: true });

		//create transaction with correct campaign and fund
		currentStep = "Create transaction in Donorfy";
		const transaction = await donorfy.createTransaction(
			formData.amount,
			formData.campaign,
			formData.paymentMethod || "PayPal", //need a paypal payment method
			constituentId,
			null, // chargeDate - will default to current date
			formData.fund || "unrestricted",
			formData.utmSource || "", //form data wont have utm, could add or send it another way
			formData.utmMedium || "",
			formData.utmCampaign || ""
		);
		const transactionId = transaction.Id;
		results.push({ step: currentStep, success: true });

		//add activity for Donation inspiration
		if (formData.inspirationDetails) {
			currentStep = "Add inspiration activity";
			const inspirationActivityData = {
				ExistingConstituentId: constituentId,
				ActivityType: "Donation inspiration",
				Notes: formData.inspirationDetails || "",
			};
			const addInspirationActivityData = await donorfy.addActivity(
				inspirationActivityData
			);
			if (addInspirationActivityData) {
				results.push({ step: currentStep, success: true });
			} else {
				results.push({ step: currentStep, success: false });
			}
		}

		//add inspiration tag
		if (formData.inspirationQuestion) {
			currentStep = "Add inspiration tag";
			await donorfy.addActiveTags(constituentId, formData.inspirationQuestion);

			results.push({ step: currentStep, success: true });
		}

		//add gift aid if applicable
		if (formData.giftAid === "true" && donorfyInstance === "uk") {
			currentStep = "Create Gift Aid declaration";
			const createGiftAidData = await donorfy.createGiftAidDeclaration(
				constituentId,
				{
					TaxPayerTitle: formData.title || "",
					TaxPayerFirstName: formData.firstName,
					TaxPayerLastName: formData.lastName,
				}
			);
			if (createGiftAidData) {
				results.push({ step: currentStep, success: true });
			} else {
				results.push({ step: currentStep, success: false });
			}
		}

		//if emailPreference is true or they are in the USA add/update mailchimp subscriber with tags and groups and potential merge tag for ORG
		//skip if this is a test to avoid mailchimp rate limiting
		if (
			(formData.emailPreference === "true" || donorfyInstance === "us") &&
			!test
		) {
			currentStep = "Add/Update Mailchimp subscriber";
			const additionalMergeFields = {};

			if (formData.organisationName) {
				additionalMergeFields.ORG = formData.organisationName;
			}

			await addUpdateSubscriber(
				session.customer_details?.email,
				formData.firstName,
				formData.lastName,
				"subscribed",
				donorfyInstance,
				Object.keys(additionalMergeFields).length > 0
					? additionalMergeFields
					: undefined
			);

			results.push({ step: currentStep, success: true });
		}

		console.log(results);

		const event = {
			...results,
			id: orderID,
			type: "paypal_donation",
			payPalOrder: orderID,
			currency: formData.currency,
		};

		await storeWebhookEvent(
			event,
			"processed",
			results,
			constituentId,
			null,
			transactionId,
			null
		);
		return NextResponse.json({
			message: `Successfully processed one-off paypal donation for constituent ${constituentId}`,
			status: 200,
		});
	} catch (error) {
		console.error("Error in PayPal donation processing API:", error);
		results.push({ step: currentStep, success: false });

		// Log the error details
		console.log("results", results);
		return NextResponse.json(
			{ error: error.message || "Internal server error" },
			{ status: 500 }
		);
	}
}
