//handles checkout session completed events
//currently configured to only process if source is set to donation app

import storeWebhookEvent from "../../db/storeWebhookEvent";
import { sql } from "@vercel/postgres";
import DonorfyClient from "../../donorfy/donorfyClient";
import addUpdateSubscriber from "../../mailchimp/addUpdateSubscriber";
import addTag from "../../mailchimp/addTag";
import sendEmailByTemplateName from "../../sparkpost/sendEmailByTemplateName";

const donorfyUK = new DonorfyClient(
	process.env.DONORFY_UK_KEY,
	process.env.DONORFY_UK_TENANT
);
const donorfyUS = new DonorfyClient(
	process.env.DONORFY_US_KEY,
	process.env.DONORFY_US_TENANT
);

// Helper function to get the appropriate Donorfy client
let donorfyInstance;
function getDonorfyClient(instance) {
	return instance === "us" ? donorfyUS : donorfyUK;
}

async function isDuplicateEvent(eventId) {
	const { rows } =
		await sql`SELECT 1 FROM processed_events WHERE event_id = ${eventId} LIMIT 1`;
	return rows.length > 0;
}

export async function handleStripeWebhookEvent(event, stripeClient) {
	const eventId = event.id;

	//check if we have already processed the event
	if (await isDuplicateEvent(eventId)) {
		console.log(`Duplicate webhook ignored: ${eventId}`);
		return;
	}

	switch (event.type) {
		case "checkout.session.completed": {
			const session = event.data.object;
			const results = [];
			let currentStep = "";
			let constituentId = null;
			let alreadyInDonorfy = false;

			//donorfy determined by currency
			donorfyInstance = session.currency === "usd" ? "us" : "uk";

			//if we plan to process on the confirmation page we should store the event straightaway to avoid duplicates

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

				console.log(`Processing Stripe Checkout Completed`);

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
				if (
					duplicateCheckData.length > 0 &&
					duplicateCheckData[0].Score >= 15
				) {
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
						County: metadata.stateCounty || "",
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
						County: metadata.stateCounty || "",
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
					metadata.fund || "unrestricted",
					metadata.utmSource || "",
					metadata.utmMedium || "",
					metadata.utmCampaign || ""
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
				if (metadata.inspirationQuestion) {
					currentStep = "Add inspiration tag";
					await donorfy.addActiveTags(constituentId, [
						metadata.inspirationQuestion,
					]);

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
				if (metadata.emailPreference === "true" || donorfyInstance === "us") {
					currentStep = "Add/Update Mailchimp subscriber";
					const additionalMergeFields = {};

					if (metadata.organisationName) {
						additionalMergeFields.ORG = metadata.organisationName;
					}

					const addSubscriberData = await addUpdateSubscriber(
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

				console.log(results);
				return {
					message: `Stripe checkout session completed. Successfully processed Freedom Foundation donation for constituent ${constituentId}`,
					status: 200,
					eventStatus: "processed",
					results,
					constituentId,
					eventId,
					donorfyTransactionId: transactionId,
				};
			} catch (error) {
				results.push({ step: currentStep, success: false });
				console.error("Error processing webhook:", error);
				error.results = results;
				error.constituentId = constituentId || null;
				error.eventId = eventId;
				throw error;
			}
		}

		default:
			console.log(`Unhandled event type: ${event.type}`);
			return {
				message: `Unhandled event type: ${event.type}`,
				status: 200,
				eventStatus: "ignored",
			};
	}
}
