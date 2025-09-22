/**
 * Handles Stripe Subscription Created webhook events.
 *
 * This function processes a newly created Stripe subscription by:
 * 1. Extracting and validating subscription data and retrieving customer details.
 * 2. Validating the webhook source.
 * 3. Initializing the Donorfy client based on subscription currency.
 * 4. Checking for existing constituent in Donorfy by email.
 * 5. Creating a new constituent or updating existing constituent details.
 * 6. Adding constituent ID to subscription and customer metadata in Stripe.
 * 7. Updating constituent preferences (all true for US instance).
 * 8. Creating a Gift Aid declaration if applicable (UK only).
 * 9. Adding or updating Mailchimp subscriber and adding subscription tag (skipped in test environments).
 * 10. Adding subscription activity to track the new subscription.
 * 11. Adding inspiration activity and tag if provided in metadata.
 * 12. Adding Donorfy tag for active subscription tracking.
 * 13. Sending subscription thank you email via SparkPost if template is configured.
 *
 * @async
 * @function handleSubscriptionCreated
 * @param {object} event - The Stripe webhook event object.
 * @param {object} stripeClient - The initialized Stripe client instance.
 * @returns {Promise<object>} Result object containing processing status, results, constituentId, eventId, and subscriptionId.
 * @throws {Error} Throws error with processing step and context if any step fails.
 */

import addTag from "@/app/lib/mailchimp/addTag";
import addUpdateSubscriber from "../../../mailchimp/addUpdateSubscriber";
import sendEmailByTemplateName from "@/app/lib/sparkpost/sendEmailByTemplateName";
import {
	getDonorfyClient,
	buildConstituentCreateData,
	buildConstituentUpdateData,
	buildConstituentPreferencesData,
	getSparkPostTemplate,
} from "@/app/lib/utils";

export async function handleSubscriptionCreated(event, stripeClient) {
	const subscription = event.data.object;
	const donorfyInstance = subscription.currency === "usd" ? "us" : "uk";
	const results = [];
	let currentStep = "";
	let constituentId = null;
	let test = process.env.VERCEL_ENV !== "production";
	let sparkPostTemplate;

	try {
		// Extract and validate subscription data
		currentStep = "Extract subscription data and retrieve customer";
		let customer = null;
		if (subscription.customer) {
			customer = await stripeClient.customers.retrieve(subscription.customer);
		}

		// Get metadata from subscription or customer
		const metadata = subscription.metadata || customer?.metadata || {};
		const source = metadata.source || "unknown";
		results.push({ step: currentStep, success: true });

		// Get SparkPost template for subscriptions
		sparkPostTemplate = getSparkPostTemplate(
			subscription.currency,
			metadata,
			"subscription"
		);

		// Validate source
		currentStep = "Validate webhook source";
		if (source !== "donation-app") {
			console.log("Ignored subscription webhook from unknown source:", source);
			return {
				message: `Subscription webhook ignored - source: ${source}`,
				status: 200,
				eventStatus: "ignored",
				results,
			};
		}
		results.push({ step: currentStep, success: true });

		console.log(`Processing Stripe Subscription Created metadata:`, metadata);

		currentStep = "Initialize Donorfy client";
		const donorfy = getDonorfyClient(donorfyInstance);
		results.push({ step: currentStep, success: true });

		// Check for existing constituent
		currentStep = "Check for duplicate in Donorfy";
		const duplicateCheckData = await donorfy.duplicateCheck({
			EmailAddress: customer?.email,
		});
		results.push({ step: currentStep, success: true });

		// Create or retrieve constituent
		if (duplicateCheckData.length > 0 && duplicateCheckData[0].Score >= 15) {
			currentStep = "Retrieve Constituent";
			constituentId = duplicateCheckData[0].ConstituentId;
			results.push({ step: currentStep, success: true });

			// Update existing constituent with latest info
			currentStep = "Update existing constituent details";
			const updateConstituentInputData = buildConstituentUpdateData(
				metadata,
				duplicateCheckData[0],
				customer?.email,
				donorfyInstance
			);
			await donorfy.updateConstituent(
				constituentId,
				updateConstituentInputData
			);
			results.push({ step: currentStep, success: true });
		} else {
			currentStep = "Create new constituent in Donorfy";
			const createConstituentInputData = buildConstituentCreateData(
				metadata,
				customer?.email,
				donorfyInstance,
				metadata.campaign
			);
			const createConstituentData = await donorfy.createConstituent(
				createConstituentInputData
			);
			constituentId = createConstituentData.ConstituentId;
			results.push({ step: currentStep, success: true });
		}

		// Add constituent id to metadata
		currentStep = "Add Constituent ID to metadata in subscription and customer";
		await stripeClient.subscriptions.update(subscription.id, {
			metadata: {
				constituentId: constituentId,
				...metadata,
			},
		});
		await stripeClient.customers.update(customer.id, {
			metadata: {
				constituentId: constituentId,
				...metadata,
			},
		});
		results.push({ step: currentStep, success: true });

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

		//if emailPreference is true or they are in the USA add/update mailchimp subscriber
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
				customer?.email,
				metadata.firstName,
				metadata.lastName,
				"subscribed",
				donorfyInstance,
				Object.keys(additionalMergeFields).length > 0
					? additionalMergeFields
					: undefined
			);
			results.push({ step: currentStep, success: true });

			currentStep = "Add Mailchimp tag: Active Stripe Subscription";
			await addTag(customer?.email, "Active Stripe Subscription", "us");
			results.push({ step: currentStep, success: true });
		}

		// Store subscription ID for future reference
		currentStep = "Add subscription activity";
		const subscriptionActivityData = {
			ExistingConstituentId: constituentId,
			ActivityType: "Stripe Subscription Created",
			Notes: `Stripe Subscription ID: ${subscription.id}, Amount: ${
				subscription.items.data[0]?.price?.unit_amount / 100 || 0
			}`,
			Number1: subscription.items.data[0]?.price?.unit_amount / 100 || 0,
		};
		await donorfy.addActivity(subscriptionActivityData);
		results.push({ step: currentStep, success: true });

		if (metadata.inspiration) {
			// Store subscription ID for future reference
			currentStep = "Add inspiration activity";
			const subscriptionActivityData = {
				ExistingConstituentId: constituentId,
				ActivityType: "Donation inspiration",
				Notes: metadata.inspirationDetails || "",
			};
			await donorfy.addActivity(subscriptionActivityData);
			results.push({ step: currentStep, success: true });

			//add inspiration tag
			currentStep = "Add inspiration tag";
			await donorfy.addActiveTags(constituentId, metadata.inspiration);
			results.push({ step: currentStep, success: true });
		}
		// Add Donorfy tag for active subscription
		currentStep = "Add Donorfy Tag: Active Stripe Subscription";
		await donorfy.addActiveTags(
			constituentId,
			"Stripe_Active Stripe Subscription"
		);
		results.push({ step: currentStep, success: true });

		if (sparkPostTemplate) {
			const currencySymbol = subscription.currency === "usd" ? "$" : "£";
			const friendlyAmount = (
				subscription.items.data[0]?.price?.unit_amount / 100
			).toFixed(2);
			const thankYouEmailSubstitutionData = {
				name: metadata.firstName,
				amount: `${currencySymbol}${friendlyAmount}`,
			};
			currentStep = "Send Sparkpost thank you email";
			await sendEmailByTemplateName(
				sparkPostTemplate,
				customer?.email,
				thankYouEmailSubstitutionData
			);
			results.push({ step: currentStep, success: true });
		}

		console.log(results);
		return {
			message: `Stripe subscription created. Successfully processed for constituent ${constituentId}`,
			status: 200,
			eventStatus: "processed",
			results,
			constituentId,
			eventId: event.id,
			subscriptionId: subscription.id, // Add subscription ID to response
		};
	} catch (error) {
		results.push({ step: currentStep, success: false });
		console.error("Error processing subscription webhook:", error);
		error.results = results;
		error.constituentId = constituentId || null;
		error.eventId = event.id;
		error.subscriptionId = subscription.id; // Add subscription ID to error response
		throw error;
	}
}
