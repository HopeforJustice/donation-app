//handles checkout session completed events
//currently configured to only process if source is set to donation app

import storeWebhookEvent from "../../db/storeWebhookEvent";
import { sql } from "@vercel/postgres";
import { duplicateCheck } from "../../donorfy/duplicateCheck";
import { createConstituent } from "../../donorfy/createConstituent";
import { updateConstituent } from "../../donorfy/updateConstituent";
import { updatePreferences } from "../../donorfy/updatePreferences";
import { createTransaction } from "../../donorfy/createTransaction";
import { addActiveTags } from "../../donorfy/addActiveTags";
import { addActivity } from "../../donorfy/addActivity";
import { createGiftAidDeclaration } from "../../donorfy/createGiftAidDeclaration";
import addUpdateSubscriber from "../../mailchimp/addUpdateSubscriber";
import addTag from "../../mailchimp/addTag";
import sendEmailByTemplateName from "../../sparkpost/sendEmailByTemplateName";
import { getConstituent } from "../../donorfy/getConstituent";

async function isDuplicateEvent(eventId) {
	const { rows } =
		await sql`SELECT 1 FROM processed_events WHERE event_id = ${eventId} LIMIT 1`;
	return rows.length > 0;
}

export async function handleStripeWebhookEvent(
	event,
	stripeClient,
	region = "uk",
	mode = "live"
) {
	const eventId = event.id;

	//check if we have already processed the event
	if (await isDuplicateEvent(eventId)) {
		console.log(`🔁 Duplicate webhook ignored: ${eventId}`);
		return;
	}

	switch (event.type) {
		case "checkout.session.completed": {
			const session = event.data.object;

			// Optionally fetch full payment intent (optional but useful)
			let paymentIntent = null;
			if (session.payment_intent) {
				paymentIntent = await stripeClient.paymentIntents.retrieve(
					session.payment_intent
				);
			}

			// Metadata to track origin
			const metadata = paymentIntent?.metadata || session.metadata || {};
			const source = metadata.source || "unknown";

			// Only handle events from Freedom foundation
			if (
				source === "donation app" &&
				metadata.campaign === "FreedomFoundation"
			) {
				console.log(
					`🎯 ${region.toUpperCase()} ${mode.toUpperCase()} | Processing:`,
					{
						email: session.customer_details?.email,
						amount: session.amount_total,
						currency: session.currency,
						campaign: metadata.campaign,
						projectId: metadata.projectId,
					}
				);
				let notes = `${region.toUpperCase()} ${mode.toUpperCase()} | `;

				//Logic here for Donorfy, Mailchimp, Sparkpost
				try {
					//check for a duplicate in Donorfy via email lookup
					const duplicateCheckData = await duplicateCheck(
						session.customer_details?.email,
						metadata.donorfyInstance
					);

					//Possibly create new constituent
					let constituentId;
					if (duplicateCheckData.alreadyInDonorfy) {
						constituentId = duplicateCheckData.constituentId;
						notes += "Found Duplicate in Donorfy. ";
					} else {
						const createConstituentInputData = {
							firstName: metadata.firstName || "",
							lastName: metadata.lastName || "",
							address1: metadata.address1 || "",
							address2: metadata.address2 || "",
							townCity: metadata.townCity || "",
							postcode: metadata.postcode || "",
							email: session.customer_details?.email || "",
							phone: metadata.phone || "",
							campaign: metadata.campaign || "",
							country: metadata.country || "",
							stateCounty: metadata.stateCounty || "",
						};
						const createConstituentData = await createConstituent(
							createConstituentInputData,
							metadata.donorfyInstance
						);
						constituentId = createConstituentData.constituentId;
						notes += "Created New Constituent. ";
					}

					//possibly update the constituent if found
					if (duplicateCheckData.alreadyInDonorfy) {
						const updateConstituentInputData = {
							firstName: metadata.firstName || "",
							lastName: metadata.lastName || "",
							address1: metadata.address1 || "",
							address2: metadata.address2 || "",
							townCity: metadata.city || "",
							postcode: metadata.postcode || "",
							phone: metadata.phone || "",
							country: metadata.country || "",
							stateCounty: metadata.stateCounty || "",
						};
						await updateConstituent(
							updateConstituentInputData,
							constituentId,
							metadata.donorfyInstance
						);
						notes += "Updated constituent details. ";
					}

					//update preferences | set all to true if US instance
					const updatePreferencesData = {
						emailPreference:
							metadata.donorfyInstance === "us"
								? true
								: metadata.emailPreference,
						postPreference:
							metadata.donorfyInstance === "us"
								? true
								: metadata.postPreference,
						smsPreference:
							metadata.donorfyInstance === "us" ? true : metadata.smsPreference,
						phonePreference:
							metadata.donorfyInstance === "us"
								? true
								: metadata.phonePreference,
					};
					await updatePreferences(
						updatePreferencesData,
						constituentId,
						metadata.donorfyInstance
					);
					notes += "Updated constituent preferences. ";

					//create transaction with correct campaign and fund
					const createTransactionData = await createTransaction(
						"donation",
						session.amount_total / 100,
						metadata.campaign,
						"Website",
						"Stripe Checkout",
						metadata.projectId,
						constituentId,
						metadata.donorfyInstance
					);

					if (createTransactionData.success) {
						notes += "Transaction created in Donorfy. ";
					}

					//Add tags in Donorfy
					const donorfyTags =
						metadata.donorType === "organisation"
							? `FreedomFoundation_${metadata.projectId},FreedomFoundation_Type Organisation`
							: `FreedomFoundation_${metadata.projectId}`;

					const addTagData = await addActiveTags(
						donorfyTags,
						constituentId,
						metadata.donorfyInstance
					);
					if (addTagData.message) {
						notes += "Tags added in Donorfy. ";
					}

					//add activity for Freedom Foundation (store organisation name here if needed)
					const ffActivityData = {
						notes: `Freedom Foundation Donation created. Amount: ${
							session.amount_total / 100
						} metadata: ${JSON.stringify(metadata)}`,
						activityType: "FreedomFoundation Donation",
					};
					const addActivityData = await addActivity(
						ffActivityData,
						constituentId,
						metadata.donorfyInstance
					);
					if (addActivityData.success) {
						notes += "Freedom Foundation Activity added in Donorfy. ";
					}

					//add activity for Donation inspiration
					if (metadata.inspirationDetails) {
						const inspirationActivityData = {
							notes: metadata.inspirationDetails || "",
							activityType: "Donation inspiration",
						};
						const addInspirationActivityData = await addActivity(
							inspirationActivityData,
							constituentId,
							metadata.donorfyInstance
						);
						if (addInspirationActivityData.success) {
							notes += "Inspiration Activity added in Donorfy. ";
						}
					}

					//add inspiration tag
					if (metadata.inspirationQuestion) {
						const addInspirationTagData = await addActiveTags(
							metadata.inspirationQuestion,
							constituentId,
							metadata.donorfyInstance
						);
						if (addInspirationTagData.message) {
							notes += "Added inspiration tag in Donorfy. ";
						}
					}

					//add gift aid if applicable
					if (
						metadata.giftAid === "true" &&
						metadata.donorfyInstance === "uk"
					) {
						const createGiftAidData = await createGiftAidDeclaration(
							{
								title: metadata.title,
								firstName: metadata.firstName,
								lastName: metadata.lastName,
							},
							constituentId,
							metadata.donorfyInstance
						);
						if (createGiftAidData.message) {
							notes += "Added GiftAid declaration in Donorfy. ";
						}
					}

					//if emailPreference is true or they are in the USA add/update mailchimp subscriber with tags and groups and potential merge tag for ORG
					if (metadata.emailPreference || metadata.donorfyInstance === "us") {
						const additionalMergeFields = {};

						if (metadata.organisationName) {
							additionalMergeFields.ORG = metadata.organisationName;
						}

						const addSubscriberData = await addUpdateSubscriber(
							session.customer_details?.email,
							metadata.firstName,
							metadata.lastName,
							"subscribed",
							metadata.donorfyInstance,
							Object.keys(additionalMergeFields).length > 0
								? additionalMergeFields
								: undefined
						);

						if (addSubscriberData.success) {
							notes += "Added/updated subscriber in Mailchimp. ";
						}
						// Add tags to the subscriber
						//FreedomFoundation Type Organisation
						//FreedomFoundation ProjectId
						if (metadata.donorType === "organisation") {
							const addDonorTypeTagData = await addTag(
								session.customer_details?.email,
								`FreedomFoundation Type Organisation`,
								metadata.donorfyInstance
							);
							if (addDonorTypeTagData.success) {
								notes += "Added donor type tag in Mailchimp. ";
							}
						}

						const addProjectTagData = await addTag(
							session.customer_details?.email,
							`FreedomFoundation Fund ${metadata.projectId}`,
							metadata.donorfyInstance
						);

						if (addProjectTagData.success) {
							notes += "Added project tag in Mailchimp. ";
						}
					}

					//trigger sparkpost emails (admin notification, thank you)
					const constituent = await getConstituent(
						constituentId,
						metadata.donorfyInstance
					);
					const constituentNumber =
						constituent.constituentData.ConstituentNumber;
					const friendlyAmount = session.amount_total / 100;
					const currencySymbol = session.currency === "gbp" ? "£" : "$";
					const adminEmailTo =
						metadata.donorfyInstance === "uk"
							? "supporters@hopeforjustice.org"
							: "donorsupport.us@hopeforjustice.org";

					const adminEmailSubstitutionData = {
						constituentNumber: constituentNumber,
						fund: metadata.projectId,
						amount: `${currencySymbol}${friendlyAmount}`,
						donorfy: "US",
					};
					const adminEmailData = await sendEmailByTemplateName(
						"freedom-foundation-admin-notification",
						adminEmailTo,
						adminEmailSubstitutionData
					);

					const thankYouEmailSubstitutionData = {
						name: metadata.firstName,
						amount: `${currencySymbol}${friendlyAmount}`,
						givingTo: metadata.givingTo,
					};

					//SPECIFIC THANK YOU TEMPLATES PER PROJEXT
					const thankYouEmailData = await sendEmailByTemplateName(
						"freedom-foundation-thank-you",
						session.customer_details?.email,
						thankYouEmailSubstitutionData
					);

					if (thankYouEmailData.results) {
						notes += "Sent Thank You via SparkPost. ";
					}
					if (adminEmailData.results) {
						notes += "Sent Admin notification via SparkPost. ";
					}
					//store the webhook event
					await storeWebhookEvent(event, "success", notes);
				} catch (error) {
					console.error("Error processing webhook:", error);
					// Store the error in the database
					await storeWebhookEvent(event, "error", error.message);
				}
			} else {
				console.log("Ignored webhook from unknown source:", source);
			}
			break;
		}

		default:
			console.log(`Unhandled event type: ${event.type}`);
	}
}
