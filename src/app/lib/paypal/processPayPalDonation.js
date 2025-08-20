import DonorfyClient from "../donorfy/donorfyClient";
import addUpdateSubscriber from "../mailchimp/addUpdateSubscriber";

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

/**
 * Process PayPal donation in Donorfy - runs asynchronously in background
 */
export async function processPayPalDonation({
	orderID,
	captureID,
	amount,
	currency,
	formData,
	mode = "test",
}) {
	const results = [];
	let currentStep = "";
	let constituentId = null;
	let alreadyInDonorfy = false;
	let donorfyInstance;
	const test = process.env.VERCEL_ENV !== "production";

	try {
		console.log(`Processing PayPal donation to Donorfy - Order: ${orderID}`);

		// Determine Donorfy instance based on currency
		currentStep = "Initialize Donorfy client";
		donorfyInstance = currency === "USD" ? "us" : "uk";
		const donorfy = getDonorfyClient(donorfyInstance);
		results.push({ step: currentStep, success: true });

		// Check for duplicate in Donorfy via email lookup
		currentStep = "Check for duplicate in Donorfy";
		const duplicateCheckData = await donorfy.duplicateCheck({
			EmailAddress: formData.email,
		});
		results.push({ step: currentStep, success: true });

		// Create or retrieve constituent
		if (duplicateCheckData.length > 0 && duplicateCheckData[0].Score >= 15) {
			currentStep = "Retrieve existing constituent";
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
				County: donorfyInstance === "us" ? formData.stateCounty || "" : "",
			};
			const createConstituentData = await donorfy.createConstituent(
				createConstituentInputData
			);
			constituentId = createConstituentData.ConstituentId;
			results.push({ step: currentStep, success: true });
		}

		// Update existing constituent if found
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
				County: donorfyInstance === "us" ? formData.stateCounty || "" : "",
			};
			await donorfy.updateConstituent(
				constituentId,
				updateConstituentInputData
			);
			results.push({ step: currentStep, success: true });
		}

		// Update preferences
		currentStep = "Update constituent preferences";
		const updatePreferencesData = {
			PreferencesList: [
				{
					PreferenceType: "Channel",
					PreferenceName: "Email",
					PreferenceAllowed:
						donorfyInstance === "us"
							? true
							: formData.emailPreference === "true",
				},
				{
					PreferenceType: "Channel",
					PreferenceName: "Mail",
					PreferenceAllowed:
						donorfyInstance === "us"
							? true
							: formData.postPreference === "true",
				},
				{
					PreferenceType: "Channel",
					PreferenceName: "Phone",
					PreferenceAllowed:
						donorfyInstance === "us"
							? true
							: formData.phonePreference === "true",
				},
				{
					PreferenceType: "Channel",
					PreferenceName: "SMS",
					PreferenceAllowed:
						donorfyInstance === "us" ? true : formData.smsPreference === "true",
				},
				{
					PreferenceType: "Purpose",
					PreferenceName: "Email Updates",
					PreferenceAllowed:
						donorfyInstance === "us"
							? true
							: formData.emailPreference === "true",
				},
			],
		};
		await donorfy.updateConstituentPreferences(
			constituentId,
			updatePreferencesData
		);
		results.push({ step: currentStep, success: true });

		// Create transaction
		currentStep = "Create transaction in Donorfy";
		const transaction = await donorfy.createTransaction(
			amount,
			formData.campaign || "PayPal Donation",
			"PayPal",
			constituentId,
			null, // chargeDate - will default to current date
			formData.fund || "unrestricted",
			formData.utmSource || "",
			formData.utmMedium || "",
			formData.utmCampaign || ""
		);
		const transactionId = transaction.Id;
		results.push({ step: currentStep, success: true });

		// Add inspiration activity if provided
		if (formData.inspirationDetails) {
			currentStep = "Add inspiration activity";
			const inspirationActivityData = {
				ExistingConstituentId: constituentId,
				ActivityType: "Donation inspiration",
				Notes: formData.inspirationDetails || "",
			};
			await donorfy.addActivity(inspirationActivityData);
			results.push({ step: currentStep, success: true });
		}

		// Add inspiration tag if provided
		if (formData.inspiration) {
			currentStep = "Add inspiration tag";
			await donorfy.addActiveTags(constituentId, formData.inspiration);
			results.push({ step: currentStep, success: true });
		}

		// Add Gift Aid if applicable (UK only)
		if (formData.giftAid === "true" && donorfyInstance === "uk") {
			currentStep = "Create Gift Aid declaration";
			await donorfy.createGiftAidDeclaration(constituentId, {
				TaxPayerTitle: formData.title || "",
				TaxPayerFirstName: formData.firstName,
				TaxPayerLastName: formData.lastName,
			});
			results.push({ step: currentStep, success: true });
		}

		// Add to Mailchimp if email preference is true (and not in test mode)
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
				formData.email,
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

		console.log("PayPal donation processing completed:", {
			orderID,
			captureID,
			constituentId,
			transactionId,
			results,
		});

		return {
			success: true,
			constituentId,
			transactionId,
			results,
		};
	} catch (error) {
		console.error("Error processing PayPal donation:", error);
		results.push({ step: currentStep, success: false, error: error.message });

		// Don't throw error - log it but don't fail the user's experience
		return {
			success: false,
			error: error.message,
			results,
			constituentId: constituentId || null,
		};
	}
}
