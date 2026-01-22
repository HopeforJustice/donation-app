// Mock dependencies
jest.mock("@/app/lib/utilities");

describe("Steps Functions", () => {
	let consoleLogSpy;
	let consoleErrorSpy;

	beforeEach(() => {
		// Spy on console methods
		consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
		consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
	});

	afterEach(() => {
		jest.clearAllMocks();
		consoleLogSpy.mockRestore();
		consoleErrorSpy.mockRestore();
	});

	describe("usStates", () => {
		let usStates;

		beforeEach(() => {
			jest.resetModules();
			const { usStates: importedStates } = require("@/app/lib/steps/usStates");
			usStates = importedStates;
		});

		it("should export an array of US states", () => {
			expect(Array.isArray(usStates)).toBe(true);
			expect(usStates.length).toBeGreaterThan(0);
		});

		it("should have correct structure for each state", () => {
			const firstState = usStates[0];
			expect(firstState).toHaveProperty("text");
			expect(firstState).toHaveProperty("value");
			expect(typeof firstState.text).toBe("string");
			expect(typeof firstState.value).toBe("string");
		});

		it("should include Alabama as first state", () => {
			expect(usStates[0]).toEqual({
				text: "Alabama",
				value: "Alabama",
			});
		});

		it("should include standard US states", () => {
			const stateNames = usStates.map((state) => state.value);
			expect(stateNames).toContain("California");
			expect(stateNames).toContain("New York");
			expect(stateNames).toContain("Texas");
			expect(stateNames).toContain("Florida");
		});

		it("should include District of Columbia", () => {
			const stateNames = usStates.map((state) => state.value);
			expect(stateNames).toContain("District of Columbia");
		});

		it("should include Armed Forces options", () => {
			const stateNames = usStates.map((state) => state.value);
			expect(stateNames).toContain("Armed Forces Americas");
			expect(stateNames).toContain("Armed Forces Europe");
			expect(stateNames).toContain("Armed Forces Pacific");
		});

		it("should have 54 total entries", () => {
			// 50 states + DC + 3 Armed Forces
			expect(usStates.length).toBe(54);
		});
	});

	describe("countries", () => {
		let countries;

		beforeEach(() => {
			jest.resetModules();
			const {
				countries: importedCountries,
			} = require("@/app/lib/steps/countries");
			countries = importedCountries;
		});

		it("should export an array of countries", () => {
			expect(Array.isArray(countries)).toBe(true);
			expect(countries.length).toBeGreaterThan(0);
		});

		it("should have correct structure for each country", () => {
			const firstCountry = countries[0];
			expect(firstCountry).toHaveProperty("text");
			expect(firstCountry).toHaveProperty("value");
			expect(typeof firstCountry.text).toBe("string");
			expect(typeof firstCountry.value).toBe("string");
		});

		it("should include major countries", () => {
			const countryNames = countries.map((country) => country.value);
			expect(countryNames).toContain("United Kingdom");
			expect(countryNames).toContain("United States");
			expect(countryNames).toContain("Canada");
			expect(countryNames).toContain("Australia");
		});

		it("should be alphabetically ordered", () => {
			const firstCountry = countries[0];
			expect(firstCountry.text).toBe("Afghanistan");
		});

		it("should include special characters in country names", () => {
			const countryNames = countries.map((country) => country.value);
			expect(countryNames).toContain("Curaçao");
		});
	});

	describe("selectOptions", () => {
		let options;

		beforeEach(() => {
			jest.resetModules();
			const {
				options: importedOptions,
			} = require("@/app/lib/steps/selectOptions");
			options = importedOptions;
		});

		it("should export options object with all required keys", () => {
			expect(options).toHaveProperty("frequencyOptions");
			expect(options).toHaveProperty("titleOptions");
			expect(options).toHaveProperty("yesNoOptions");
			expect(options).toHaveProperty("directDebitDayOptions");
			expect(options).toHaveProperty("giftAidOptions");
			expect(options).toHaveProperty("countryOptions");
			expect(options).toHaveProperty("stateCountyOptions");
			expect(options).toHaveProperty("inspirationOptions");
		});

		it("should have correct frequency options", () => {
			expect(options.frequencyOptions).toEqual([
				{ text: "Monthly", value: "monthly" },
				{ text: "Once", value: "once" },
			]);
		});

		it("should have title options including standard titles", () => {
			const titles = options.titleOptions.map((opt) => opt.value);
			expect(titles).toContain("Mr");
			expect(titles).toContain("Mrs");
			expect(titles).toContain("Miss");
			expect(titles).toContain("Ms");
			expect(titles).toContain("Dr");
		});

		it("should have yes/no options with boolean values", () => {
			expect(options.yesNoOptions).toEqual([
				{ text: "Yes", value: true },
				{ text: "No", value: false },
			]);
		});

		it("should have direct debit day options", () => {
			expect(options.directDebitDayOptions).toEqual([
				{ text: "1st", value: 1 },
				{ text: "15th", value: 15 },
				{ text: "25th", value: 25 },
			]);
		});

		it("should have gift aid options with boolean values", () => {
			expect(options.giftAidOptions).toEqual([
				{ text: "Yes", value: true },
				{ text: "No", value: false },
			]);
		});

		it("should reference imported country options", () => {
			expect(Array.isArray(options.countryOptions)).toBe(true);
			expect(options.countryOptions.length).toBeGreaterThan(0);
		});

		it("should reference imported state options", () => {
			expect(Array.isArray(options.stateCountyOptions)).toBe(true);
			expect(options.stateCountyOptions.length).toBe(54);
		});

		it("should have inspiration options with correct values", () => {
			const inspirationValues = options.inspirationOptions.map(
				(opt) => opt.value,
			);
			expect(inspirationValues).toContain("Inspiration_Faith");
			expect(inspirationValues).toContain("Inspiration_SocialMedia");
			expect(inspirationValues).toContain("Inspiration_StaffContact");
			expect(inspirationValues).toContain("Inspiration_Celebration");
			expect(inspirationValues).toContain("Inspiration_Cause");
			expect(inspirationValues).toContain("Inspiration_Event");
			expect(inspirationValues).toContain("Inspiration_Other");
		});
	});

	describe("labelsAndDescriptions", () => {
		let labelsAndDescriptions;

		beforeEach(() => {
			jest.resetModules();
			const {
				labelsAndDescriptions: importedLabels,
			} = require("@/app/lib/steps/labelsAndDecriptions");
			labelsAndDescriptions = importedLabels;
		});

		it("should export object with field labels", () => {
			expect(labelsAndDescriptions.amount).toBe("Amount");
			expect(labelsAndDescriptions.frequency).toBe("Frequency");
			expect(labelsAndDescriptions.firstName).toBe("First name");
			expect(labelsAndDescriptions.lastName).toBe("Last name");
			expect(labelsAndDescriptions.email).toBe("Email");
		});

		it("should have phone description with GB-specific text", () => {
			expect(labelsAndDescriptions.phoneDescription).toHaveProperty("GB");
			expect(labelsAndDescriptions.phoneDescription).toHaveProperty("default");
			expect(typeof labelsAndDescriptions.phoneDescription.GB).toBe("string");
			expect(labelsAndDescriptions.phoneDescription.default).toBe(null);
		});

		it("should have address description with currency and frequency variants", () => {
			expect(labelsAndDescriptions.addressDescription).toHaveProperty("GB");
			expect(labelsAndDescriptions.addressDescription.GB).toHaveProperty(
				"monthly",
			);
			expect(labelsAndDescriptions.addressDescription.GB).toHaveProperty(
				"once",
			);
			expect(labelsAndDescriptions.addressDescription).toHaveProperty(
				"default",
			);
		});

		it("should have postcode with US variant", () => {
			expect(labelsAndDescriptions.postcode).toHaveProperty("US");
			expect(labelsAndDescriptions.postcode).toHaveProperty("default");
			expect(labelsAndDescriptions.postcode.US).toBe("Zip Code");
			expect(labelsAndDescriptions.postcode.default).toBe("Postcode");
		});

		it("should have countyOrState with regional variants", () => {
			expect(labelsAndDescriptions.countyOrState).toHaveProperty("GB");
			expect(labelsAndDescriptions.countyOrState).toHaveProperty("US");
			expect(labelsAndDescriptions.countyOrState).toHaveProperty("AU");
			expect(labelsAndDescriptions.countyOrState).toHaveProperty("default");
			expect(labelsAndDescriptions.countyOrState.GB).toBe("County");
			expect(labelsAndDescriptions.countyOrState.US).toBe("State");
		});

		it("should have Gift Aid description and label", () => {
			expect(typeof labelsAndDescriptions.giftAidDescription).toBe("string");
			expect(labelsAndDescriptions.giftAidDescription).toContain("25p");
			expect(typeof labelsAndDescriptions.giftAidLabel).toBe("string");
		});

		it("should have Gift Aid options description as array", () => {
			expect(
				Array.isArray(labelsAndDescriptions.giftAidOptionsDescription),
			).toBe(true);
			expect(labelsAndDescriptions.giftAidOptionsDescription.length).toBe(2);
		});

		it("should have preferences description", () => {
			expect(typeof labelsAndDescriptions.preferencesDescription).toBe(
				"string",
			);
		});

		it("should have contact preferences description as array with HTML", () => {
			expect(
				Array.isArray(labelsAndDescriptions.contactPreferencesDescription),
			).toBe(true);
			expect(labelsAndDescriptions.contactPreferencesDescription[0]).toContain(
				"Privacy Policy",
			);
		});
	});

	describe("stepTemplates", () => {
		let stepTemplates;

		beforeEach(() => {
			jest.resetModules();
			const {
				stepTemplates: importedTemplates,
			} = require("@/app/lib/steps/stepTemplates");
			stepTemplates = importedTemplates;
		});

		it("should export an array of step templates", () => {
			expect(Array.isArray(stepTemplates)).toBe(true);
			expect(stepTemplates.length).toBeGreaterThan(0);
		});

		it("should have basicInfo step", () => {
			const basicInfo = stepTemplates.find((step) => step.id === "basicInfo");
			expect(basicInfo).toBeDefined();
			expect(basicInfo.title).toBe("Your Details:");
			expect(Array.isArray(basicInfo.fields)).toBe(true);
		});

		it("should have addressDetails step", () => {
			const addressDetails = stepTemplates.find(
				(step) => step.id === "addressDetails",
			);
			expect(addressDetails).toBeDefined();
			expect(addressDetails.title).toBe("Address Details:");
		});

		it("should have giftAid step with visibility conditions", () => {
			const giftAid = stepTemplates.find((step) => step.id === "giftAid");
			expect(giftAid).toBeDefined();
			expect(giftAid.visibilityConditions).toEqual({ currency: "gbp" });
		});

		it("should have preferences step with visibility conditions", () => {
			const preferences = stepTemplates.find(
				(step) => step.id === "preferences",
			);
			expect(preferences).toBeDefined();
			expect(preferences.visibilityConditions).toEqual({
				currency: ["gbp", "nok"],
			});
		});

		it("should have paymentDetails step", () => {
			const paymentDetails = stepTemplates.find(
				(step) => step.id === "paymentDetails",
			);
			expect(paymentDetails).toBeDefined();
			expect(paymentDetails.title).toBe("Choose your payment method");
		});

		it("should have hidden campaign field in basicInfo", () => {
			const basicInfo = stepTemplates.find((step) => step.id === "basicInfo");
			const campaignField = basicInfo.fields.find(
				(field) => field.id === "campaign",
			);
			expect(campaignField).toBeDefined();
			expect(campaignField.hidden).toBe(true);
			expect(campaignField.defaultValue).toBe("Donation App General Campaign");
		});

		it("should have UTM fields in basicInfo", () => {
			const basicInfo = stepTemplates.find((step) => step.id === "basicInfo");
			const utmFields = basicInfo.fields.filter((field) =>
				field.id?.startsWith("utm_"),
			);
			expect(utmFields.length).toBe(3);
			expect(utmFields.every((field) => field.hidden === true)).toBe(true);
		});

		it("should have amount field with currency options", () => {
			const basicInfo = stepTemplates.find((step) => step.id === "basicInfo");
			const givingDetails = basicInfo.fields.find(
				(field) => field.id === "givingDetails",
			);
			const amountField = givingDetails.fields.find(
				(field) => field.id === "amount",
			);
			expect(amountField).toBeDefined();
			expect(amountField.type).toBe("amount");
			expect(Array.isArray(amountField.acceptedCurrencies)).toBe(true);
			expect(amountField.acceptedCurrencies.length).toBe(3);
		});

		it("should have directDebitStartDate field with visibility conditions", () => {
			const basicInfo = stepTemplates.find((step) => step.id === "basicInfo");
			const directDebitField = basicInfo.fields.find(
				(field) => field.id === "directDebitStartDate",
			);
			expect(directDebitField).toBeDefined();
			expect(directDebitField.visibilityConditions).toEqual({
				currency: "gbp",
				frequency: "monthly",
			});
		});

		it("should have addressSearch field in addressDetails", () => {
			const addressDetails = stepTemplates.find(
				(step) => step.id === "addressDetails",
			);
			const addressSearchField = addressDetails.fields.find(
				(field) => field.id === "addressSearch",
			);
			expect(addressSearchField).toBeDefined();
			expect(addressSearchField.type).toBe("addressSearch");
		});

		it("should have stateCounty field with US visibility", () => {
			const addressDetails = stepTemplates.find(
				(step) => step.id === "addressDetails",
			);
			const stateCountyField = addressDetails.fields.find(
				(field) => field.id === "stateCounty",
			);
			expect(stateCountyField).toBeDefined();
			expect(stateCountyField.visibilityConditions).toEqual({
				currency: "usd",
			});
		});

		it("should have contact preference toggles with icons", () => {
			const preferences = stepTemplates.find(
				(step) => step.id === "preferences",
			);
			const contactPreferences = preferences.fields.find(
				(field) => field.id === "contactPreferences",
			);
			expect(contactPreferences).toBeDefined();
			const emailPref = contactPreferences.fields.find(
				(field) => field.id === "emailPreference",
			);
			expect(emailPref).toBeDefined();
			expect(emailPref.type).toBe("toggle");
			expect(emailPref.defaultValue).toBe(true);
			expect(emailPref.icon).toBeDefined();
		});

		it("should have Stripe payment with visibility function", () => {
			const paymentDetails = stepTemplates.find(
				(step) => step.id === "paymentDetails",
			);
			const stripeField = paymentDetails.fields.find(
				(field) => field.id === "stripePayment",
			);
			expect(stripeField).toBeDefined();
			expect(typeof stripeField.visibilityConditions).toBe("function");
		});

		it("should have PayPal payment with once frequency condition", () => {
			const paymentDetails = stepTemplates.find(
				(step) => step.id === "paymentDetails",
			);
			const paypalField = paymentDetails.fields.find(
				(field) => field.id === "payPalPaymentStep",
			);
			expect(paypalField).toBeDefined();
			expect(paypalField.visibilityConditions).toEqual({
				frequency: "once",
			});
		});
	});

	describe("generateSteps", () => {
		let generateSteps;

		beforeEach(() => {
			jest.resetModules();
			const {
				generateSteps: importedFunction,
			} = require("@/app/lib/steps/generateSteps");
			generateSteps = importedFunction;
		});

		it("should generate steps for GBP monthly donation", () => {
			const steps = generateSteps({ currency: "gbp", frequency: "monthly" });
			expect(Array.isArray(steps)).toBe(true);
			expect(steps.length).toBeGreaterThan(0);
		});

		it("should include giftAid step for GBP currency", () => {
			const steps = generateSteps({ currency: "gbp", frequency: "once" });
			const giftAidStep = steps.find((step) => step.id === "giftAid");
			expect(giftAidStep).toBeDefined();
		});

		it("should exclude giftAid step for USD currency", () => {
			const steps = generateSteps({ currency: "usd", frequency: "once" });
			const giftAidStep = steps.find((step) => step.id === "giftAid");
			expect(giftAidStep).toBeUndefined();
		});

		it("should include preferences step for GBP currency", () => {
			const steps = generateSteps({ currency: "gbp", frequency: "once" });
			const preferencesStep = steps.find((step) => step.id === "preferences");
			expect(preferencesStep).toBeDefined();
		});

		it("should include preferences step for NOK currency", () => {
			const steps = generateSteps({ currency: "nok", frequency: "once" });
			const preferencesStep = steps.find((step) => step.id === "preferences");
			expect(preferencesStep).toBeDefined();
		});

		it("should exclude preferences step for USD currency", () => {
			const steps = generateSteps({ currency: "usd", frequency: "once" });
			const preferencesStep = steps.find((step) => step.id === "preferences");
			expect(preferencesStep).toBeUndefined();
		});

		it("should show directDebitStartDate for GBP monthly", () => {
			const steps = generateSteps({ currency: "gbp", frequency: "monthly" });
			const basicInfo = steps.find((step) => step.id === "basicInfo");
			const directDebitField = basicInfo.fields.find(
				(field) => field.id === "directDebitStartDate",
			);
			expect(directDebitField).toBeDefined();
		});

		it("should hide directDebitStartDate for GBP once", () => {
			const steps = generateSteps({ currency: "gbp", frequency: "once" });
			const basicInfo = steps.find((step) => step.id === "basicInfo");
			const directDebitField = basicInfo.fields.find(
				(field) => field.id === "directDebitStartDate",
			);
			expect(directDebitField).toBeUndefined();
		});

		it("should show stateCounty field for USD currency", () => {
			const steps = generateSteps({ currency: "usd", frequency: "once" });
			const addressDetails = steps.find((step) => step.id === "addressDetails");
			const stateCountyField = addressDetails.fields.find(
				(field) => field.id === "stateCounty",
			);
			expect(stateCountyField).toBeDefined();
		});

		it("should hide stateCounty field for GBP currency", () => {
			const steps = generateSteps({ currency: "gbp", frequency: "once" });
			const addressDetails = steps.find((step) => step.id === "addressDetails");
			const stateCountyField = addressDetails.fields.find(
				(field) => field.id === "stateCounty",
			);
			expect(stateCountyField).toBeUndefined();
		});

		it("should set country default to United Kingdom for GBP", () => {
			const steps = generateSteps({ currency: "gbp", frequency: "once" });
			const addressDetails = steps.find((step) => step.id === "addressDetails");
			const countryField = addressDetails.fields.find(
				(field) => field.id === "country",
			);
			expect(countryField.defaultValue).toBe("United Kingdom");
		});

		it("should set country default to United States for USD", () => {
			const steps = generateSteps({ currency: "usd", frequency: "once" });
			const addressDetails = steps.find((step) => step.id === "addressDetails");
			const countryField = addressDetails.fields.find(
				(field) => field.id === "country",
			);
			expect(countryField.defaultValue).toBe("United States");
		});

		it("should resolve labels from labelsAndDescriptions", () => {
			const steps = generateSteps({ currency: "gbp", frequency: "once" });
			const basicInfo = steps.find((step) => step.id === "basicInfo");
			// Find email field which is not in a fieldGroup
			const emailField = basicInfo.fields.find((field) => field.id === "email");
			expect(emailField.label).toBe("Email");
		});

		it("should resolve country-specific labels for postcode", () => {
			const stepsUSD = generateSteps({ currency: "usd", frequency: "once" });
			const addressDetailsUSD = stepsUSD.find(
				(step) => step.id === "addressDetails",
			);
			const postcodeFieldUSD = addressDetailsUSD.fields
				.find((field) => field.type === "fieldGroup")
				.fields.find((field) => field.id === "postcode");
			expect(postcodeFieldUSD.label).toBe("Zip Code");

			const stepsGBP = generateSteps({ currency: "gbp", frequency: "once" });
			const addressDetailsGBP = stepsGBP.find(
				(step) => step.id === "addressDetails",
			);
			const postcodeFieldGBP = addressDetailsGBP.fields
				.find((field) => field.type === "fieldGroup")
				.fields.find((field) => field.id === "postcode");
			expect(postcodeFieldGBP.label).toBe("Postcode");
		});

		it("should resolve options from selectOptions", () => {
			const steps = generateSteps({ currency: "gbp", frequency: "once" });
			const basicInfo = steps.find((step) => step.id === "basicInfo");
			const titleField = basicInfo.fields.find((field) => field.id === "title");
			expect(Array.isArray(titleField.options)).toBe(true);
			expect(titleField.options.length).toBeGreaterThan(0);
			expect(titleField.options[0]).toHaveProperty("text");
			expect(titleField.options[0]).toHaveProperty("value");
		});

		it("should resolve frequency-specific address descriptions", () => {
			const stepsMonthly = generateSteps({
				currency: "gbp",
				frequency: "monthly",
			});
			const addressDetailsMonthly = stepsMonthly.find(
				(step) => step.id === "addressDetails",
			);
			expect(addressDetailsMonthly.description).toContain("Direct Debit");

			const stepsOnce = generateSteps({ currency: "gbp", frequency: "once" });
			const addressDetailsOnce = stepsOnce.find(
				(step) => step.id === "addressDetails",
			);
			expect(addressDetailsOnce.description).toBe(null);
		});

		it("should filter out empty steps", () => {
			const steps = generateSteps({ currency: "usd", frequency: "once" });
			// All returned steps should have at least one field
			steps.forEach((step) => {
				expect(step.fields.length).toBeGreaterThan(0);
			});
		});

		it("should handle field groups correctly", () => {
			const steps = generateSteps({ currency: "gbp", frequency: "once" });
			const basicInfo = steps.find((step) => step.id === "basicInfo");
			const fieldGroup = basicInfo.fields.find(
				(field) => field.type === "fieldGroup" && field.fields,
			);
			expect(fieldGroup).toBeDefined();
			expect(Array.isArray(fieldGroup.fields)).toBe(true);
		});

		it("should handle function-based visibility conditions", () => {
			const steps = generateSteps({ currency: "gbp", frequency: "monthly" });
			const paymentDetails = steps.find((step) => step.id === "paymentDetails");
			// For GBP monthly, paymentDetails step should be filtered out (no payment methods)
			// or have only Direct Debit which is not in the payment step
			if (paymentDetails) {
				const stripeField = paymentDetails.fields.find(
					(field) => field.id === "stripePayment",
				);
				expect(stripeField).toBeUndefined();
			}
		});

		it("should show Stripe for GBP once-off", () => {
			const steps = generateSteps({ currency: "gbp", frequency: "once" });
			const paymentDetails = steps.find((step) => step.id === "paymentDetails");
			const stripeField = paymentDetails.fields.find(
				(field) => field.id === "stripePayment",
			);
			expect(stripeField).toBeDefined();
		});

		it("should show PayPal only for once frequency", () => {
			const stepsOnce = generateSteps({ currency: "gbp", frequency: "once" });
			const paymentDetailsOnce = stepsOnce.find(
				(step) => step.id === "paymentDetails",
			);
			const paypalFieldOnce = paymentDetailsOnce.fields.find(
				(field) => field.id === "payPalPaymentStep",
			);
			expect(paypalFieldOnce).toBeDefined();

			const stepsMonthly = generateSteps({
				currency: "gbp",
				frequency: "monthly",
			});
			const paymentDetailsMonthly = stepsMonthly.find(
				(step) => step.id === "paymentDetails",
			);
			if (paymentDetailsMonthly) {
				const paypalFieldMonthly = paymentDetailsMonthly.fields.find(
					(field) => field.id === "payPalPaymentStep",
				);
				expect(paypalFieldMonthly).toBeUndefined();
			}
		});

		it("should handle NOK currency", () => {
			const steps = generateSteps({ currency: "nok", frequency: "once" });
			expect(steps.length).toBeGreaterThan(0);
			// Preferences should be shown for NOK
			const preferencesStep = steps.find((step) => step.id === "preferences");
			expect(preferencesStep).toBeDefined();
		});

		it("should handle AUD currency", () => {
			const steps = generateSteps({ currency: "aud", frequency: "once" });
			expect(steps.length).toBeGreaterThan(0);
		});

		it("should show title field for GBP currency", () => {
			const steps = generateSteps({ currency: "gbp", frequency: "once" });
			const basicInfo = steps.find((step) => step.id === "basicInfo");
			const titleField = basicInfo.fields.find((field) => field.id === "title");
			expect(titleField).toBeDefined();
		});
	});
});
