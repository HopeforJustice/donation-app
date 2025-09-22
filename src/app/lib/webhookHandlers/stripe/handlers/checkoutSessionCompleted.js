import processCampaign from "@/app/lib/campaigns/processCampaign";
import DonorfyClient from "../../../donorfy/donorfyClient";
import addUpdateSubscriber from "../../../mailchimp/addUpdateSubscriber";
import sendEmailByTemplateName from "@/app/lib/sparkpost/sendEmailByTemplateName";
import { buildConstituentUpdateData } from "@/app/lib/utils/constituentUtils";

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

export async function handleCheckoutSessionCompleted(event, stripeClient) {
	const session = event.data.object;
	const results = [];
	let currentStep = "";
	let constituentId = null;
	let alreadyInDonorfy = false;
	let donorfyInstance;
	let test = process.env.VERCEL_ENV !== "production";
	let sparkPostTemplate;

	// default sparkpost templates
	if (session.currency === "usd") {
		sparkPostTemplate = "donation-receipt-2024-usa-stripe";
	} else if (session.currency === "gbp") {
		sparkPostTemplate = "donation-receipt-2024-uk-stripe";
	}

	try {
		// Extract and validate session data
		currentStep = "Extract session data and retrieve payment intent";
		let paymentIntent = null;
		if (session.payment_intent) {
			paymentIntent = await stripeClient.paymentIntents.retrieve(
				session.payment_intent
			);
		}

		// Metadata to track origin
		const metadata = paymentIntent?.metadata || session.metadata || {};
		const source = metadata.source || "unknown";
		results.push({ step: currentStep, success: true });

		// custom sparkpost template or set to none
		if (metadata.sparkPostTemplate) {
			sparkPostTemplate =
				metadata.sparkPostTemplate === "none"
					? null
					: metadata.sparkPostTemplate;
		}

		// Validate source and campaign
		currentStep = "Validate webhook source and campaign";
		if (source !== "donation-app") {
			console.log("Ignored webhook from unknown source:", source);
			return {
				message: `Webhook ignored - source: ${source}, campaign: ${metadata.campaign}`,
				status: 200,
				eventStatus: "ignored",
				results,
			};
		}
		results.push({ step: currentStep, success: true });

		// Check if this is a subscription checkout - if so, skip processing as subscription.created will handle it
		if (session.mode === "subscription") {
			console.log(
				"Skipping subscription checkout - will be handled by subscription.created event"
			);
			return {
				message:
					"Subscription checkout ignored - handled by subscription.created",
				status: 200,
				eventStatus: "ignored",
				results,
			};
		}

		console.log(`Processing Stripe Checkout Completed (One-off payment)`);

		currentStep = "Initialize Donorfy client";
		//donorfy determined by currency
		donorfyInstance = session.currency === "usd" ? "us" : "uk";
		const donorfy = getDonorfyClient(donorfyInstance);
		results.push({ step: currentStep, success: true });

		// Check for a duplicate in Donorfy via email lookup
		currentStep = "Check for duplicate in Donorfy";
		const duplicateCheckData = await donorfy.duplicateCheck({
			EmailAddress: session.customer_details?.email,
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
				Title: metadata.title || "",
				FirstName: metadata.firstName || "",
				LastName: metadata.lastName || "",
				AddressLine1: metadata.address1 || "",
				AddressLine2: metadata.address2 || "",
				Town: metadata.townCity || "",
				PostalCode: metadata.postcode || "",
				EmailAddress: session.customer_details?.email || "",
				Phone1: metadata.phone || "",
				RecruitmentCampaign: metadata.campaign || "",
				County: donorfyInstance === "us" ? metadata.stateCounty : "",
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
			const updateConstituentInputData = buildConstituentUpdateData(
				metadata,
				duplicateCheckData[0],
				session.customer_details?.email,
				donorfyInstance
			);
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
						donorfyInstance === "us" ? true : metadata.emailPreference,
				},
				{
					PreferenceType: "Channel",
					PreferenceName: "Mail",
					PreferenceAllowed:
						donorfyInstance === "us" ? true : metadata.postPreference,
				},
				{
					PreferenceType: "Channel",
					PreferenceName: "Phone",
					PreferenceAllowed:
						donorfyInstance === "us" ? true : metadata.phonePreference,
				},
				{
					PreferenceType: "Channel",
					PreferenceName: "SMS",
					PreferenceAllowed:
						donorfyInstance === "us" ? true : metadata.smsPreference,
				},
				{
					PreferenceType: "Purpose",
					PreferenceName: "Email Updates",
					PreferenceAllowed:
						donorfyInstance === "us" ? true : metadata.emailPreference,
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
			session.amount_total / 100,
			metadata.campaign,
			metadata.paymentMethod || "Stripe Checkout",
			constituentId,
			null, // chargeDate - will default to current date
			metadata.projectId || metadata.fund || "unrestricted",
			metadata.utmSource || "unknown",
			metadata.utmMedium || "unknown",
			metadata.utmCampaign || "unknown"
		);
		const transactionId = transaction.Id;
		results.push({ step: currentStep, success: true });

		//add activity for Donation inspiration
		if (metadata.inspirationDetails) {
			currentStep = "Add inspiration activity";
			const inspirationActivityData = {
				ExistingConstituentId: constituentId,
				ActivityType: "Donation inspiration",
				Notes: metadata.inspirationDetails || "",
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
		if (metadata.inspiration) {
			currentStep = "Add inspiration tag";
			await donorfy.addActiveTags(constituentId, metadata.inspiration);

			results.push({ step: currentStep, success: true });
		}

		//add gift aid if applicable
		if (metadata.giftAid === "true" && donorfyInstance === "uk") {
			currentStep = "Create Gift Aid declaration";
			const createGiftAidData = await donorfy.createGiftAidDeclaration(
				constituentId,
				{
					TaxPayerTitle: metadata.title || "",
					TaxPayerFirstName: metadata.firstName,
					TaxPayerLastName: metadata.lastName,
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
			(metadata.emailPreference === "true" || donorfyInstance === "us") &&
			!test
		) {
			currentStep = "Add/Update Mailchimp subscriber";
			const additionalMergeFields = {};

			if (metadata.organisationName) {
				additionalMergeFields.ORG = metadata.organisationName;
			}

			await addUpdateSubscriber(
				session.customer_details?.email,
				metadata.firstName,
				metadata.lastName,
				"subscribed",
				donorfyInstance,
				Object.keys(additionalMergeFields).length > 0
					? additionalMergeFields
					: undefined
			);

			results.push({ step: currentStep, success: true });
		}

		if (sparkPostTemplate && metadata.campaign !== "FreedomFoundation") {
			const currencySymbol = session.currency === "usd" ? "$" : "£";
			const friendlyAmount = (session.amount_total / 100).toFixed(2);
			const thankYouEmailSubstitutionData = {
				name: metadata.firstName,
				amount: `${currencySymbol}${friendlyAmount}`,
			};
			currentStep = "Send Sparkpost thank you email";
			await sendEmailByTemplateName(
				sparkPostTemplate,
				session.customer_details?.email,
				thankYouEmailSubstitutionData
			);
			results.push({ step: currentStep, success: true });
		}

		currentStep = "process campaign logic";
		await processCampaign(
			metadata.campaign,
			null,
			metadata,
			constituentId,
			session.currency,
			(session.amount_total / 100).toFixed(2)
		);
		results.push({ step: currentStep, success: true });

		console.log(results);
		return {
			message: `Stripe checkout session completed. Successfully processed one-off donation for constituent ${constituentId}`,
			status: 200,
			eventStatus: "processed",
			results,
			constituentId,
			eventId: event.id,
			donorfyTransactionId: transactionId,
		};
	} catch (error) {
		results.push({ step: currentStep, success: false });
		console.error("Error processing checkout session webhook:", error);
		error.results = results;
		error.constituentId = constituentId || null;
		error.eventId = event.id;
		throw error;
	}
}
