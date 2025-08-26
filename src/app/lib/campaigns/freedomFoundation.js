/* 
FreedomFoundation Campaign specific workflows
*/
import DonorfyClient from "../donorfy/donorfyClient";
import addTag from "../mailchimp/addTag";
import sendEmailByTemplateName from "../sparkpost/sendEmailByTemplateName";

const donorfyUK = new DonorfyClient(
	process.env.DONORFY_UK_KEY,
	process.env.DONORFY_UK_TENANT
);
const donorfyUS = new DonorfyClient(
	process.env.DONORFY_US_KEY,
	process.env.DONORFY_US_TENANT
);

const results = [];
let currentStep;
const test = process.env.VERCEL_ENV !== "production";

export default async function freedomFoundation(
	formData,
	metadata,
	constituentId,
	currency,
	amount
) {
	try {
		const emailPreference =
			metadata?.emailPreference || formData.emailPreference || null;
		const projectId = metadata?.projectId || formData.projectId || null;
		const givingTo = metadata?.givingTo || formData.givingTo || null;
		const donorType = metadata?.donorType || formData.donorType || null;
		const organisationName =
			metadata?.organisationName || formData.organisationName || null;
		const donorfy = currency === "usd" ? donorfyUS : donorfyUK;
		const donorfyInstance = currency === "usd" ? "us" : "uk";

		const constituent = await donorfy.getConstituent(constituentId);

		console.log(
			`Processing Freedom Foundation campaign for Constituent ID: ${constituentId} emailPreference: ${emailPreference} projectId: ${projectId} givingTo: ${givingTo} donorType: ${donorType} organisationName: ${organisationName} donorfyInstance: ${donorfyInstance}`
		);

		//Add tags in Donorfy
		currentStep = "Add tags in Donorfy";
		const donorfyTags =
			donorType === "organisation"
				? `FreedomFoundation_${projectId},FreedomFoundation_Type Organisation`
				: `FreedomFoundation_${projectId}`;

		await donorfy.addActiveTags(constituentId, donorfyTags);
		results.push({ step: currentStep, success: true });

		//trigger sparkpost emails (admin notification, thank you)
		const currencySymbol = currency === "gbp" ? "£" : "$";
		const adminEmailTo = test
			? "james.holt@hopeforjustice.org"
			: donorfyInstance === "uk"
			? "supporters@hopeforjustice.org"
			: "donorsupport.us@hopeforjustice.org";

		currentStep = "Send admin notification email";
		const adminEmailSubstitutionData = {
			constituentNumber: constituentId,
			fund: projectId,
			amount: `${currencySymbol}${amount}`,
			donorfy: donorfyInstance === "us" ? "US" : "UK",
		};
		await sendEmailByTemplateName(
			"freedom-foundation-admin-notification",
			adminEmailTo,
			adminEmailSubstitutionData
		);
		results.push({ step: currentStep, success: true });

		currentStep = "Send thank you email";
		const thankYouEmailSubstitutionData = {
			name: constituent.FirstName || null,
			amount: `${currencySymbol}${amount}`,
			givingTo: givingTo,
		};

		let sparkPostTemplate;
		if (projectId === "PP1028 Deborah") {
			sparkPostTemplate = "freedom-foundation-thank-you-PP1028-Deborah";
		} else if (projectId === "PP1006 Advocacy") {
			sparkPostTemplate = "freedom-foundation-thank-you-PP1006-Advocacy";
		} else if (projectId === "PP1010 Midwest") {
			sparkPostTemplate = "freedom-foundation-thank-you-PP1010-Midwest";
		} else if (projectId === "PP1009 Tennessee") {
			sparkPostTemplate = "freedom-foundation-thank-you-PP1009-Tennessee";
		} else if (projectId === "FF25 USA Policy") {
			sparkPostTemplate = "freedom-foundation-thank-you-FF25-USA-Policy";
		} else if (projectId === "PP1018 Uganda") {
			sparkPostTemplate = "freedom-foundation-thank-you-PP1018-Uganda";
		}

		await sendEmailByTemplateName(
			sparkPostTemplate,
			constituent.EmailAddress,
			thankYouEmailSubstitutionData
		);
		results.push({ step: currentStep, success: true });

		// Add Freedom Foundation activity in Donorfy
		currentStep = "Add Freedom Foundation activity";
		const ffActivityData = {
			ConstituentId: constituentId,
			ActivityType: "FreedomFoundation Donation",
			Campaign: "FreedomFoundation",
			Notes: `Freedom Foundation Donation created.
				donorType: ${donorType}, organisationName: ${organisationName}, projectId: ${projectId}, givingTo: ${givingTo}`,
		};
		const addActivityData = await donorfy.addActivity(ffActivityData);
		if (addActivityData) {
			results.push({ step: currentStep, success: true });
		} else {
			results.push({ step: currentStep, success: false });
		}

		// Mailchimp tags
		if (emailPreference === "true" && !test) {
			// // Add tags to the subscriber
			if (donorType === "organisation") {
				currentStep = "Add donor type tag in Mailchimp";
				await addTag(
					constituent.EmailAddress,
					`FreedomFoundation Type Organisation`,
					donorfyInstance
				);
				results.push({ step: currentStep, success: true });
			}

			currentStep = "Add dont send welcome email tag in Mailchimp";
			await addTag(
				session.customer_details?.email,
				`Dont send welcome email`,
				donorfyInstance
			);
			results.push({ step: currentStep, success: true });

			currentStep = "Add project tag in Mailchimp";
			await addTag(
				session.customer_details?.email,
				`FreedomFoundation Fund ${metadata.projectId}`,
				donorfyInstance
			);
			results.push({ step: currentStep, success: true });
		}
		console.log(results);
	} catch (error) {
		results.push({ step: currentStep, success: false });
		console.log(results);
		console.error("Error processing Freedom Foundation campaign:", error);
		throw new Error(
			`Failed to process Freedom Foundation campaign: ${error.message}`
		);
	}
}
