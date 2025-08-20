import addTag from "@/app/lib/mailchimp/addTag";
import DonorfyClient from "../../../donorfy/donorfyClient";
import addUpdateSubscriber from "../../../mailchimp/addUpdateSubscriber";

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

export async function handleSubscriptionCreated(event, stripeClient) {
	const subscription = event.data.object;
	const results = [];
	let currentStep = "";
	let constituentId = null;
	let donorfyInstance;
	let test = process.env.VERCEL_ENV !== "production";
	let sparkPostTemplate;

	// default sparkpost templates
	if (subscription.currency === "usd") {
		sparkPostTemplate = "usa-monthly-donation";
	} else if (subscription.currency === "gbp") {
		sparkPostTemplate = null;
	}

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

		// custom sparkpost template or set to none
		if (metadata.sparkPostTemplate) {
			sparkPostTemplate =
				metadata.sparkPostTemplate === "none"
					? null
					: metadata.sparkPostTemplate;
		}

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
		//donorfy determined by currency
		donorfyInstance = subscription.currency === "usd" ? "us" : "uk";
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
			const updateConstituentInputData = {
				Title: metadata.title || "",
				FirstName: metadata.firstName || "",
				LastName: metadata.lastName || "",
				AddressLine1: metadata.address1 || "",
				AddressLine2: metadata.address2 || "",
				Town: metadata.townCity || "",
				PostalCode: metadata.postcode || "",
				EmailAddress: customer?.email || "",
				Phone1: metadata.phone || "",
				RecruitmentCampaign: metadata.campaign || "",
				County: donorfyInstance === "us" ? metadata.stateCounty : "",
			};
			await donorfy.updateConstituent(
				constituentId,
				updateConstituentInputData
			);
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
				EmailAddress: customer?.email || "",
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
			const currencySymbol = session.currency === "usd" ? "$" : "£";
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
