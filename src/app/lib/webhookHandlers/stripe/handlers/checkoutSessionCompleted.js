/**
 * Handles Stripe Checkout Session Completed webhook events for one-off payments.
 *
 * This function processes a completed Stripe Checkout session by:
 * 1. Extracting and validating session data and payment intent.
 * 2. Validating the webhook source and campaign.
 * 3. Skipping processing if the session is for a subscription (handled in subscription created handler).
 * 4. Initializing the Donorfy client based on the session currency.
 * 5. Checking for a duplicate constituent in Donorfy by email.
 * 6. Creating a new constituent in Donorfy if no duplicate is found.
 * 7. Updating existing constituent details if already present.
 * 8. Updating constituent preferences (all true for US instance).
 * 9. Creating a transaction in Donorfy with campaign and fund details.
 * 10. Adding an "inspiration" activity if provided in metadata.
 * 11. Adding an "inspiration" tag if provided in metadata.
 * 12. Creating a Gift Aid declaration if applicable (UK only).
 * 13. Adding or updating a Mailchimp subscriber if email preference is true or US instance (skipped in test environments).
 * 14. Sending a thank you email via SparkPost unless suppressed or for specific campaigns.
 * 15. Processing additional campaign logic via `processCampaign`.
 *
 * @async
 * @function handleCheckoutSessionCompleted
 * @param {object} event - The Stripe webhook event object.
 * @param {object} stripeClient - The initialized Stripe client instance.
 * @returns {Promise<object>} Result object containing processing status, results, constituentId, eventId, and Donorfy transaction ID.
 * @throws {Error} Throws error with processing step and context if any step fails.
 */

import processCampaign from "@/app/lib/campaigns/processCampaign";
import addUpdateSubscriber from "../../../mailchimp/addUpdateSubscriber";
import sendEmailByTemplateName from "@/app/lib/sparkpost/sendEmailByTemplateName";
import {
	buildConstituentUpdateData,
	buildConstituentPreferencesData,
	buildConstituentCreateData,
	getDonorfyClient,
	getSparkPostTemplate,
	sendThankYouEmail,
} from "@/app/lib/utils";

export async function handleCheckoutSessionCompleted(event, stripeClient) {
	const session = event.data.object;
	const donorfyInstance = session.currency === "usd" ? "us" : "uk";
	const results = []; // Builds results object for logging and db storage
	let currentStep = "";
	let constituentId = null;
	let alreadyInDonorfy = false;
	let test = process.env.VERCEL_ENV !== "production";
	let sparkPostTemplate;

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

		// Get SparkPost template based on currency and metadata
		sparkPostTemplate = getSparkPostTemplate(session.currency, metadata);

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
			const createConstituentInputData = buildConstituentCreateData(
				metadata,
				session.customer_details?.email,
				donorfyInstance
			);
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
		const updatePreferencesData = buildConstituentPreferencesData(
			metadata,
			donorfyInstance
		);
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

		//send thank you email unless suppressed or FreedomFoundation campaign
		//FreedomFoundation sends it's own sparkpost emails
		currentStep = "Send Sparkpost thank you email";
		const emailSent = await sendThankYouEmail(
			sparkPostTemplate,
			metadata.campaign,
			session.customer_details?.email,
			metadata.firstName,
			session.amount_total / 100,
			session.currency,
			sendEmailByTemplateName
		);
		if (emailSent) {
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
