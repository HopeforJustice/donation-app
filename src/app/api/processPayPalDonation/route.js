/**
 * Handles the processing of a PayPal donation.
 *
 * Steps performed:
 * 1. Parses and validates the incoming donation data from the request body.
 * 2. Determines the appropriate Donorfy instance (US/UK) based on currency.
 * 3. Checks for an existing constituent in Donorfy by email.
 * 4. Creates a new constituent in Donorfy if not found, or updates details if found.
 * 5. Updates constituent communication preferences.
 * 6. Creates a donation transaction in Donorfy.
 * 7. Optionally adds an inspiration activity and tag if provided.
 * 8. Creates a Gift Aid declaration for UK donors if applicable.
 * 9. Adds or updates the donor as a Mailchimp subscriber if eligible.
 * 10. Sends a thank you email using SparkPost.
 * 11. Processes any additional campaign logic.
 * 12. Stores the event and processing results for auditing.
 * 13. Handles and reports errors, sending an error email if needed.
 *
 * @param {Request} req - The Next.js API request object containing PayPal donation data.
 * @returns {Promise<NextResponse>} A JSON response indicating success or failure.
 */

import { NextResponse } from "next/server";
import storeWebhookEvent from "@/app/lib/db/storeWebhookEvent";
import sendErrorEmail from "@/app/lib/sparkpost/sendErrorEmail";
import addUpdateSubscriber from "@/app/lib/mailchimp/addUpdateSubscriber";
import sendEmailByTemplateName from "@/app/lib/sparkpost/sendEmailByTemplateName";
import processCampaign from "@/app/lib/campaigns/processCampaign";
import {
	getDonorfyClient,
	getSparkPostTemplate,
	sendThankYouEmail,
} from "@/app/lib/utils";

export async function POST(req) {
	const results = [];
	let currentStep = "";
	let constituentId = null;
	let alreadyInDonorfy = false;
	let donorfyInstance;
	let test = process.env.VERCEL_ENV !== "production";
	let sparkPostTemplate;

	try {
		const { orderID, captureID, amount, formData, paymentDetails } =
			await req.json();

		// Get SparkPost template based on currency and form data
		sparkPostTemplate = getSparkPostTemplate(formData.currency, formData);

		// Validate required data
		if (!orderID || !captureID || !amount || !formData) {
			return NextResponse.json(
				{ error: "Missing required donation data" },
				{ status: 400 }
			);
		}

		// Determine payment method from PayPal response (Venmo vs PayPal)
		const paymentMethod =
			paymentDetails?.paymentMethod || formData.paymentMethod || "PayPal";

		console.log(
			`Processing PayPal donation Order: ${orderID}, Payment Method: ${paymentMethod}`
		);

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
			paymentMethod, // Use detected payment method (Venmo or PayPal)
			constituentId,
			null, // chargeDate - will default to current date
			formData.projectId || formData.fund || "unrestricted",
			formData.utm_source || "unknown",
			formData.utm_medium || "unknown",
			formData.utm_campaign || "unknown"
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

		//send sparkpost email receipt
		//dont send detault template if Freedom Foundation campaign
		currentStep = "Send Sparkpost thank you email";
		const emailSent = await sendThankYouEmail(
			sparkPostTemplate,
			formData.campaign,
			formData.email,
			formData.firstName,
			formData.amount,
			formData.currency,
			sendEmailByTemplateName
		);
		if (emailSent) {
			results.push({ step: currentStep, success: true });
		}

		currentStep = "process campaign logic";
		await processCampaign(
			formData.campaign,
			formData,
			null,
			constituentId,
			formData.currency,
			formData.amount
		);
		results.push({ step: currentStep, success: true });

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
			JSON.stringify(results, null, 2),
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
		await sendErrorEmail(error, {
			name: "PayPal donation processing failed",
			event: {
				results: JSON.stringify(results, null, 2),
				error: error.message,
			},
		});

		// Log the error details
		console.log("results", results);
		return NextResponse.json(
			{ error: error.message || "Internal server error" },
			{ status: 500 }
		);
	}
}
