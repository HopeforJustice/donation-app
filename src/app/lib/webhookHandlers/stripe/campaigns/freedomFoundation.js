/* 
				FF specific
				*/
//Add tags in Donorfy
// currentStep = "Add tags in Donorfy";
// const donorfyTags =
// 	metadata.donorType === "organisation"
// 		? `FreedomFoundation_${metadata.projectId},FreedomFoundation_Type Organisation`
// 		: `FreedomFoundation_${metadata.projectId}`;

// const addTagData = await donorfy.addActiveTags(
// 	constituentId,
// 	donorfyTags.split(",")
// );
// if (addTagData) {
// 	results.push({ step: currentStep, success: true });
// } else {
// 	results.push({ step: currentStep, success: false });
// }

//add activity for Freedom Foundation (store organisation name here if needed)
// currentStep = "Add Freedom Foundation activity";
// const ffActivityData = {
// 	ConstituentId: constituentId,
// 	ActivityType: "FreedomFoundation Donation",
// 	Campaign: "FreedomFoundation",
// 	Notes: `Freedom Foundation Donation created. Amount: ${
// 		session.amount_total / 100
// 	} metadata: ${JSON.stringify(metadata)}`,
// };
// const addActivityData = await donorfy.addActivity(ffActivityData);
// if (addActivityData) {
// 	results.push({ step: currentStep, success: true });
// } else {
// 	results.push({ step: currentStep, success: false });
// }
/* 
				/FF specific
				*/

/* 
					FF specific
					*/
// // Add tags to the subscriber
// if (metadata.donorType === "organisation") {
// 	currentStep = "Add donor type tag in Mailchimp";
// 	const addDonorTypeTagData = await addTag(
// 		session.customer_details?.email,
// 		`FreedomFoundation Type Organisation`,
// 		donorfyInstance
// 	);
// 	if (addDonorTypeTagData.success) {
// 		results.push({ step: currentStep, success: true });
// 	} else {
// 		results.push({ step: currentStep, success: false });
// 	}
// }

// currentStep = "Add welcome email tag in Mailchimp";
// const addDontSendWelcomeEmailTagData = await addTag(
// 	session.customer_details?.email,
// 	`Dont send welcome email`,
// 	donorfyInstance
// );
// if (addDontSendWelcomeEmailTagData.success) {
// 	results.push({ step: currentStep, success: true });
// } else {
// 	results.push({ step: currentStep, success: false });
// }

// currentStep = "Add project tag in Mailchimp";
// const addProjectTagData = await addTag(
// 	session.customer_details?.email,
// 	`FreedomFoundation Fund ${metadata.projectId}`,
// 	donorfyInstance
// );

// if (addProjectTagData.success) {
// 	results.push({ step: currentStep, success: true });
// } else {
// 	results.push({ step: currentStep, success: false });
// }
/* 
					/ FF specific
					*/

/* 
				 FF specific
				*/
//trigger sparkpost emails (admin notification, thank you)
// currentStep = "Get constituent details for emails";
// const constituent = await donorfy.getConstituent(constituentId);
// const constituentNumber = constituent.ConstituentNumber;
// const friendlyAmount = session.amount_total / 100;
// const currencySymbol = session.currency === "gbp" ? "£" : "$";
// const adminEmailTo =
// 	donorfyInstance === "uk"
// 		? "supporters@hopeforjustice.org"
// 		: "donorsupport.us@hopeforjustice.org";
// results.push({ step: currentStep, success: true });

// currentStep = "Send admin notification email";
// const adminEmailSubstitutionData = {
// 	constituentNumber: constituentNumber,
// 	fund: metadata.projectId,
// 	amount: `${currencySymbol}${friendlyAmount}`,
// 	donorfy: donorfyInstance === "us" ? "US" : "UK",
// };
// const adminEmailData = await sendEmailByTemplateName(
// 	"freedom-foundation-admin-notification",
// 	adminEmailTo,
// 	adminEmailSubstitutionData
// );

// if (adminEmailData.results) {
// 	results.push({ step: currentStep, success: true });
// } else {
// 	results.push({ step: currentStep, success: false });
// }

// currentStep = "Send thank you email";
// const thankYouEmailSubstitutionData = {
// 	name: metadata.firstName,
// 	amount: `${currencySymbol}${friendlyAmount}`,
// 	givingTo: metadata.givingTo,
// };

// let sparkPostTemplate;
// if (metadata.projectId === "PP1028 Deborah") {
// 	sparkPostTemplate = "freedom-foundation-thank-you-PP1028-Deborah";
// } else if (metadata.projectId === "PP1006 Advocacy") {
// 	sparkPostTemplate = "freedom-foundation-thank-you-PP1006-Advocacy";
// } else if (metadata.projectId === "PP1010 Midwest") {
// 	sparkPostTemplate = "freedom-foundation-thank-you-PP1010-Midwest";
// } else if (metadata.projectId === "PP1009 Tennessee") {
// 	sparkPostTemplate = "freedom-foundation-thank-you-PP1009-Tennessee";
// } else if (metadata.projectId === "FF25 USA Policy") {
// 	sparkPostTemplate = "freedom-foundation-thank-you-FF25-USA-Policy";
// } else if (metadata.projectId === "PP1018 Uganda") {
// 	sparkPostTemplate = "freedom-foundation-thank-you-PP1018-Uganda";
// }

// const thankYouEmailData = await sendEmailByTemplateName(
// 	sparkPostTemplate,
// 	session.customer_details?.email,
// 	thankYouEmailSubstitutionData
// );

// if (thankYouEmailData.results) {
// 	results.push({ step: currentStep, success: true });
// } else {
// 	results.push({ step: currentStep, success: false });
// }
/* 
				 FF specific
				*/
