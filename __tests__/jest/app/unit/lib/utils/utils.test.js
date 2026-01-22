// Mock dependencies
jest.mock("@/app/lib/donorfy/donorfyClient");

describe("Utils Functions", () => {
	let consoleLogSpy;
	let consoleErrorSpy;

	beforeEach(() => {
		consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
		consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
	});

	afterEach(() => {
		jest.clearAllMocks();
		consoleLogSpy.mockRestore();
		consoleErrorSpy.mockRestore();
	});

	describe("currencyUtils", () => {
		let findCurrencySymbol;

		beforeEach(() => {
			jest.resetModules();
			const {
				findCurrencySymbol: importedFunction,
			} = require("@/app/lib/utils/currencyUtils");
			findCurrencySymbol = importedFunction;
		});

		it("should return £ for GBP", () => {
			expect(findCurrencySymbol("gbp")).toBe("£");
		});

		it("should return $ for USD", () => {
			expect(findCurrencySymbol("usd")).toBe("$");
		});

		it("should return kr for NOK", () => {
			expect(findCurrencySymbol("nok")).toBe("kr");
		});

		it("should return $ for AUD", () => {
			expect(findCurrencySymbol("aud")).toBe("$");
		});

		it("should return uppercase currency code for unknown currency", () => {
			expect(findCurrencySymbol("eur")).toBe("EUR");
		});

		it("should handle null/undefined currency", () => {
			expect(findCurrencySymbol(null)).toBe("");
			expect(findCurrencySymbol(undefined)).toBe("");
		});
	});

	describe("dataUtils", () => {
		let stripMetadata, sanitiseForLogging, getCookie;

		beforeEach(() => {
			jest.resetModules();
			const utils = require("@/app/lib/utils/dataUtils");
			stripMetadata = utils.stripMetadata;
			sanitiseForLogging = utils.sanitiseForLogging;
			getCookie = utils.getCookie;
		});

		describe("stripMetadata", () => {
			it("should strip metadata field from object", () => {
				const input = {
					name: "John",
					metadata: { secret: "data" },
					other: "value",
				};
				const result = stripMetadata(input);
				expect(result).toEqual({ name: "John", other: "value" });
			});

			it("should strip resource_metadata field", () => {
				const input = {
					name: "John",
					resource_metadata: { secret: "data" },
				};
				const result = stripMetadata(input);
				expect(result).toEqual({ name: "John" });
			});

			it("should handle nested objects", () => {
				const input = {
					user: {
						name: "John",
						metadata: { secret: "data" },
					},
				};
				const result = stripMetadata(input);
				expect(result).toEqual({ user: { name: "John" } });
			});

			it("should handle arrays", () => {
				const input = [
					{ id: 1, metadata: { secret: "data" } },
					{ id: 2, metadata: { secret: "data2" } },
				];
				const result = stripMetadata(input);
				expect(result).toEqual([{ id: 1 }, { id: 2 }]);
			});

			it("should return primitive values unchanged", () => {
				expect(stripMetadata("test")).toBe("test");
				expect(stripMetadata(123)).toBe(123);
				expect(stripMetadata(null)).toBe(null);
			});
		});

		describe("sanitiseForLogging", () => {
			it("should redact sensitive fields", () => {
				const body = JSON.stringify({
					email: "test@example.com",
					firstName: "John",
					amount: 100,
				});
				const result = sanitiseForLogging(body);
				const parsed = JSON.parse(result);
				expect(parsed.email).toBe("[REDACTED]");
				expect(parsed.firstName).toBe("[REDACTED]");
				expect(parsed.amount).toBe(100);
			});

			it("should handle Donorfy field names", () => {
				const body = JSON.stringify({
					EmailAddress: "test@example.com",
					FirstName: "John",
					LastName: "Doe",
					Phone1: "1234567890",
				});
				const result = sanitiseForLogging(body);
				const parsed = JSON.parse(result);
				expect(parsed.EmailAddress).toBe("[REDACTED]");
				expect(parsed.FirstName).toBe("[REDACTED]");
				expect(parsed.LastName).toBe("[REDACTED]");
				expect(parsed.Phone1).toBe("[REDACTED]");
			});

			it("should return [no body] for null/undefined", () => {
				expect(sanitiseForLogging(null)).toBe("[no body]");
				expect(sanitiseForLogging(undefined)).toBe("[no body]");
			});

			it("should handle unparseable JSON", () => {
				const result = sanitiseForLogging("invalid json");
				expect(result).toContain("[unparseable body:");
			});
		});

		describe("getCookie", () => {
			it("should return cookie value when found", () => {
				Object.defineProperty(document, "cookie", {
					writable: true,
					value: "testCookie=testValue; otherCookie=otherValue",
				});
				expect(getCookie("testCookie")).toBe("testValue");
			});

			it("should return null when cookie not found", () => {
				Object.defineProperty(document, "cookie", {
					writable: true,
					value: "otherCookie=otherValue",
				});
				expect(getCookie("testCookie")).toBe(null);
			});
		});
	});

	describe("formUtils", () => {
		let onlyNumbers,
			handlePhoneInput,
			formatAmount,
			getLocaleForCurrency,
			parseAndFormatAmount,
			matchFundingOn,
			getLocaleFromCurrency,
			formatAmountWithLocale;

		beforeEach(() => {
			jest.resetModules();
			const utils = require("@/app/lib/utils/formUtils");
			onlyNumbers = utils.onlyNumbers;
			handlePhoneInput = utils.handlePhoneInput;
			formatAmount = utils.formatAmount;
			getLocaleForCurrency = utils.getLocaleForCurrency;
			parseAndFormatAmount = utils.parseAndFormatAmount;
			matchFundingOn = utils.matchFundingOn;
			getLocaleFromCurrency = utils.getLocaleFromCurrency;
			formatAmountWithLocale = utils.formatAmountWithLocale;
		});

		describe("onlyNumbers", () => {
			it("should allow only numbers and period for non-NOK", () => {
				const event = { target: { value: "abc123.45xyz" } };
				onlyNumbers(event, "usd");
				expect(event.target.value).toBe("123.45");
			});

			it("should allow only numbers and comma for NOK", () => {
				const event = { target: { value: "abc123,45xyz" } };
				onlyNumbers(event, "nok");
				expect(event.target.value).toBe("123,45");
			});

			it("should allow only one period", () => {
				const event = { target: { value: "123.45.67" } };
				onlyNumbers(event, "usd");
				expect(event.target.value).toBe("123.45");
			});

			it("should allow only one comma for NOK", () => {
				const event = { target: { value: "123,45,67" } };
				onlyNumbers(event, "nok");
				expect(event.target.value).toBe("123,45");
			});

			it("should handle leading zeros without decimal", () => {
				const event = { target: { value: "000123" } };
				onlyNumbers(event, "usd");
				expect(event.target.value).toBe("0123");
			});
		});

		describe("handlePhoneInput", () => {
			it("should allow only numbers and phone characters", () => {
				const event = { target: { value: "abc+44(0)123xyz" } };
				handlePhoneInput(event);
				expect(event.target.value).toBe("+44(0)123");
			});

			it("should remove letters and special chars except phone ones", () => {
				const event = { target: { value: "123-456#789@" } };
				handlePhoneInput(event);
				expect(event.target.value).toBe("123456789");
			});
		});

		describe("formatAmount", () => {
			it("should format amount with period for non-NOK", () => {
				expect(formatAmount("100", "usd")).toBe("100.00");
			});

			it("should format amount with comma for NOK", () => {
				expect(formatAmount("100", "nok")).toBe("100,00");
			});

			it("should convert comma to period then format for non-NOK", () => {
				expect(formatAmount("100,50", "usd")).toBe("100.50");
			});

			it("should preserve comma for NOK", () => {
				expect(formatAmount("100,50", "nok")).toBe("100,50");
			});
		});

		describe("getLocaleForCurrency", () => {
			it("should return Norwegian locale for NOK", () => {
				expect(getLocaleForCurrency("nok")).toBe("nb-NO");
			});

			it("should return British locale for GBP", () => {
				expect(getLocaleForCurrency("gbp")).toBe("en-GB");
			});

			it("should return US locale for USD", () => {
				expect(getLocaleForCurrency("usd")).toBe("en-US");
			});

			it("should return Australian locale for AUD", () => {
				expect(getLocaleForCurrency("aud")).toBe("en-AU");
			});

			it("should return undefined for unknown currency", () => {
				expect(getLocaleForCurrency("eur")).toBe(undefined);
			});

			it("should be case-insensitive", () => {
				expect(getLocaleForCurrency("NOK")).toBe("nb-NO");
				expect(getLocaleForCurrency("GBP")).toBe("en-GB");
			});
		});

		describe("parseAndFormatAmount", () => {
			it("should format whole numbers without decimals", () => {
				const result = parseAndFormatAmount("100", "usd");
				expect(result).toBe("100");
			});

			it("should format decimal numbers with 2 decimal places", () => {
				const result = parseAndFormatAmount("100.5", "usd");
				expect(result).toBe("100.50");
			});

			it("should handle NOK comma format", () => {
				const result = parseAndFormatAmount("100,50", "nok");
				expect(result).toMatch(/100[.,]50/); // Different locales may format differently
			});

			it("should handle zero amounts", () => {
				const result = parseAndFormatAmount("0", "usd");
				expect(result).toBe("0");
			});
		});

		describe("matchFundingOn", () => {
			it("should return false for campaigns not in funding list", () => {
				expect(matchFundingOn("GeneralCampaign")).toBe(false);
			});

			it("should log match funding status", () => {
				matchFundingOn("TestCampaign");
				expect(consoleLogSpy).toHaveBeenCalledWith(
					"NO matchfunding for campaign:",
					"TestCampaign",
				);
			});
		});

		describe("getLocaleFromCurrency", () => {
			it("should return correct locale for GBP", () => {
				expect(getLocaleFromCurrency("gbp")).toBe("en-GB");
			});

			it("should return correct locale for USD", () => {
				expect(getLocaleFromCurrency("usd")).toBe("en-US");
			});

			it("should return correct locale for NOK", () => {
				expect(getLocaleFromCurrency("nok")).toBe("nb-NO");
			});

			it("should return correct locale for AUD", () => {
				expect(getLocaleFromCurrency("aud")).toBe("en-AU");
			});

			it("should return correct locale for EUR", () => {
				expect(getLocaleFromCurrency("eur")).toBe("de-DE");
			});

			it("should default to en-US for unknown currency", () => {
				expect(getLocaleFromCurrency("xyz")).toBe("en-US");
			});

			it("should be case-insensitive", () => {
				expect(getLocaleFromCurrency("GBP")).toBe("en-GB");
			});
		});

		describe("formatAmountWithLocale", () => {
			it("should format numeric amounts", () => {
				const result = formatAmountWithLocale(100, "usd");
				expect(result).toBe("100");
			});

			it("should format string amounts", () => {
				const result = formatAmountWithLocale("100.50", "usd");
				expect(result).toBe("100.5");
			});

			it("should handle NaN values", () => {
				const result = formatAmountWithLocale("invalid", "usd");
				expect(result).toBe("0");
			});

			it("should format with appropriate decimals", () => {
				const result = formatAmountWithLocale(100.567, "usd");
				expect(result).toBe("100.57");
			});
		});
	});

	describe("constituentUtils", () => {
		let buildConstituentUpdateData,
			buildConstituentCreateData,
			buildConstituentPreferencesData;

		beforeEach(() => {
			jest.resetModules();
			const utils = require("@/app/lib/utils/constituentUtils");
			buildConstituentUpdateData = utils.buildConstituentUpdateData;
			buildConstituentCreateData = utils.buildConstituentCreateData;
			buildConstituentPreferencesData = utils.buildConstituentPreferencesData;
		});

		describe("buildConstituentUpdateData", () => {
			it("should use metadata values when available", () => {
				const metadata = {
					title: "Mr",
					firstName: "John",
					lastName: "Doe",
					address1: "123 Main St",
					phone: "1234567890",
				};
				const existingData = {};
				const result = buildConstituentUpdateData(
					metadata,
					existingData,
					"test@example.com",
					"uk",
				);

				expect(result.Title).toBe("Mr");
				expect(result.FirstName).toBe("John");
				expect(result.LastName).toBe("Doe");
				expect(result.AddressLine1).toBe("123 Main St");
				expect(result.EmailAddress).toBe("test@example.com");
			});

			it("should fall back to existing data when metadata missing", () => {
				const metadata = { firstName: "John" };
				const existingData = {
					Title: "Mrs",
					LastName: "Smith",
					AddressLine1: "456 Oak Ave",
				};
				const result = buildConstituentUpdateData(
					metadata,
					existingData,
					"test@example.com",
					"uk",
				);

				expect(result.FirstName).toBe("John");
				expect(result.Title).toBe("Mrs");
				expect(result.LastName).toBe("Smith");
				expect(result.AddressLine1).toBe("456 Oak Ave");
			});

			it("should handle townCity and city aliases", () => {
				const metadata1 = { townCity: "London" };
				const result1 = buildConstituentUpdateData(
					metadata1,
					{},
					"test@example.com",
					"uk",
				);
				expect(result1.Town).toBe("London");

				const metadata2 = { city: "New York" };
				const result2 = buildConstituentUpdateData(
					metadata2,
					{},
					"test@example.com",
					"us",
				);
				expect(result2.Town).toBe("New York");
			});

			it("should handle postcode and postalCode aliases", () => {
				const metadata1 = { postcode: "SW1A 1AA" };
				const result1 = buildConstituentUpdateData(
					metadata1,
					{},
					"test@example.com",
					"uk",
				);
				expect(result1.PostalCode).toBe("SW1A 1AA");

				const metadata2 = { postalCode: "10001" };
				const result2 = buildConstituentUpdateData(
					metadata2,
					{},
					"test@example.com",
					"us",
				);
				expect(result2.PostalCode).toBe("10001");
			});
		});

		describe("buildConstituentCreateData", () => {
			it("should create constituent with all provided data", () => {
				const metadata = {
					title: "Mr",
					firstName: "John",
					lastName: "Doe",
					address1: "123 Main St",
					address2: "Apt 4",
					townCity: "London",
					postcode: "SW1A 1AA",
					phone: "1234567890",
					country: "United Kingdom",
				};
				const result = buildConstituentCreateData(
					metadata,
					"test@example.com",
					"uk",
					"TestCampaign",
				);

				expect(result.ConstituentType).toBe("individual");
				expect(result.Title).toBe("Mr");
				expect(result.FirstName).toBe("John");
				expect(result.LastName).toBe("Doe");
				expect(result.RecruitmentCampaign).toBe("TestCampaign");
			});

			it("should use default campaign when not provided", () => {
				const result = buildConstituentCreateData({}, "test@example.com", "uk");
				expect(result.RecruitmentCampaign).toBe(
					"Donation App General Campaign",
				);
			});

			it("should handle US instance with stateCounty", () => {
				const metadata = { stateCounty: "California" };
				const result = buildConstituentCreateData(
					metadata,
					"test@example.com",
					"us",
				);
				expect(result.County).toBe("California");
			});

			it("should use metadata campaign if no explicit campaign provided", () => {
				const metadata = { campaign: "MetadataCampaign" };
				const result = buildConstituentCreateData(
					metadata,
					"test@example.com",
					"uk",
				);
				expect(result.RecruitmentCampaign).toBe("MetadataCampaign");
			});
		});

		describe("buildConstituentPreferencesData", () => {
			it("should default all preferences to true for US instance", () => {
				const result = buildConstituentPreferencesData({}, "us");
				expect(result.PreferencesList).toHaveLength(5);
				result.PreferencesList.forEach((pref) => {
					expect(pref.PreferenceAllowed).toBe(true);
				});
			});

			it("should use metadata values for non-US instances", () => {
				const metadata = {
					emailPreference: true,
					postPreference: false,
					phonePreference: true,
					smsPreference: false,
				};
				const result = buildConstituentPreferencesData(metadata, "uk");

				expect(
					result.PreferencesList.find((p) => p.PreferenceName === "Email")
						.PreferenceAllowed,
				).toBe(true);
				expect(
					result.PreferencesList.find((p) => p.PreferenceName === "Mail")
						.PreferenceAllowed,
				).toBe(false);
				expect(
					result.PreferencesList.find((p) => p.PreferenceName === "Phone")
						.PreferenceAllowed,
				).toBe(true);
				expect(
					result.PreferencesList.find((p) => p.PreferenceName === "SMS")
						.PreferenceAllowed,
				).toBe(false);
			});

			it("should default to false for UK when preference not provided", () => {
				const result = buildConstituentPreferencesData({}, "uk");
				result.PreferencesList.forEach((pref) => {
					expect(pref.PreferenceAllowed).toBe(false);
				});
			});

			it("should handle null/undefined metadata", () => {
				const result1 = buildConstituentPreferencesData(null, "uk");
				expect(result1.PreferencesList).toHaveLength(5);

				const result2 = buildConstituentPreferencesData(undefined, "uk");
				expect(result2.PreferencesList).toHaveLength(5);
			});

			it("should include Email Updates preference", () => {
				const result = buildConstituentPreferencesData(
					{ emailPreference: true },
					"uk",
				);
				const emailUpdatesPref = result.PreferencesList.find(
					(p) => p.PreferenceName === "Email Updates",
				);
				expect(emailUpdatesPref).toBeDefined();
				expect(emailUpdatesPref.PreferenceType).toBe("Purpose");
				expect(emailUpdatesPref.PreferenceAllowed).toBe(true);
			});
		});
	});

	describe("apiUtils", () => {
		let getDonorfyClient,
			fetchWithAuth,
			extractPreferences,
			getPreferences,
			poll,
			getSparkPostTemplate,
			sendThankYouEmail;

		beforeEach(() => {
			jest.resetModules();
			process.env.VERCEL_ENV = "production";
			const utils = require("@/app/lib/utils/apiUtils");
			getDonorfyClient = utils.getDonorfyClient;
			fetchWithAuth = utils.fetchWithAuth;
			extractPreferences = utils.extractPreferences;
			getPreferences = utils.getPreferences;
			poll = utils.poll;
			getSparkPostTemplate = utils.getSparkPostTemplate;
			sendThankYouEmail = utils.sendThankYouEmail;
		});

		afterEach(() => {
			delete process.env.VERCEL_ENV;
		});

		describe("getDonorfyClient", () => {
			it("should return US client for us instance in production", () => {
				const client = getDonorfyClient("us");
				expect(client).toBeDefined();
			});

			it("should return UK client for uk instance in production", () => {
				const client = getDonorfyClient("uk");
				expect(client).toBeDefined();
			});

			it("should return ROW client for row instance", () => {
				const client = getDonorfyClient("row");
				expect(client).toBeDefined();
			});

			it("should return sandbox client when not in production", () => {
				process.env.VERCEL_ENV = "development";
				jest.resetModules();
				const {
					getDonorfyClient: newGetDonorfyClient,
				} = require("@/app/lib/utils/apiUtils");
				const client = newGetDonorfyClient("us");
				expect(client).toBeDefined();
				expect(consoleLogSpy).toHaveBeenCalledWith(
					"Using Donorfy Sandbox instance",
				);
			});

			it("should return sandbox client when explicitly requested", () => {
				const client = getDonorfyClient("sandbox");
				expect(client).toBeDefined();
				expect(consoleLogSpy).toHaveBeenCalledWith(
					"Using Donorfy Sandbox instance",
				);
			});

			it("should throw error for invalid instance", () => {
				expect(() => getDonorfyClient("invalid")).toThrow(
					"Invalid Donorfy instance: invalid.",
				);
			});
		});

		describe("fetchWithAuth", () => {
			beforeEach(() => {
				global.fetch = jest.fn();
			});

			it("should make authenticated request successfully", async () => {
				const mockResponse = { success: true, data: "test" };
				global.fetch.mockResolvedValue({
					ok: true,
					json: async () => mockResponse,
				});

				const result = await fetchWithAuth(
					"https://api.test.com",
					"POST",
					{ test: "data" },
					"test-api-key",
				);

				expect(global.fetch).toHaveBeenCalledWith("https://api.test.com", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"next-api-key": "test-api-key",
					},
					body: JSON.stringify({ test: "data" }),
				});
				expect(result).toEqual(mockResponse);
			});

			it("should throw error on failed request", async () => {
				global.fetch.mockResolvedValue({
					ok: false,
					json: async () => ({ message: "Request failed" }),
				});

				await expect(
					fetchWithAuth(
						"https://api.test.com",
						"POST",
						{ test: "data" },
						"test-api-key",
					),
				).rejects.toThrow("Request failed");
			});
		});

		describe("extractPreferences", () => {
			it("should extract channel preferences", async () => {
				const data = {
					preferences: [
						{
							PreferenceType: "Channel",
							PreferenceName: "Email",
							PreferenceAllowed: true,
						},
						{
							PreferenceType: "Channel",
							PreferenceName: "Mail",
							PreferenceAllowed: false,
						},
					],
				};
				const result = await extractPreferences(data);
				expect(result.emailPreference).toBe(true);
				expect(result.postPreference).toBe(false);
			});

			it("should handle null preferences", async () => {
				const result = await extractPreferences({});
				expect(result).toEqual({});
			});

			it("should default to false when PreferenceAllowed is null", async () => {
				const data = {
					preferences: [
						{
							PreferenceType: "Channel",
							PreferenceName: "Email",
							PreferenceAllowed: null,
						},
					],
				};
				const result = await extractPreferences(data);
				expect(result.emailPreference).toBe(false);
			});

			it("should map all preference types", async () => {
				const data = {
					preferences: [
						{
							PreferenceType: "Channel",
							PreferenceName: "Email",
							PreferenceAllowed: true,
						},
						{
							PreferenceType: "Channel",
							PreferenceName: "Mail",
							PreferenceAllowed: true,
						},
						{
							PreferenceType: "Channel",
							PreferenceName: "Phone",
							PreferenceAllowed: true,
						},
						{
							PreferenceType: "Channel",
							PreferenceName: "SMS",
							PreferenceAllowed: true,
						},
					],
				};
				const result = await extractPreferences(data);
				expect(result).toEqual({
					emailPreference: true,
					postPreference: true,
					phonePreference: true,
					smsPreference: true,
				});
			});
		});

		describe("poll", () => {
			it("should return result when condition met", async () => {
				let callCount = 0;
				const fn = jest.fn(async () => {
					callCount++;
					return callCount === 2 ? "success" : null;
				});

				const result = await poll(fn, { interval: 10, timeout: 1000 });
				expect(result).toBe("success");
				expect(fn).toHaveBeenCalledTimes(2);
			});

			it("should throw error on timeout", async () => {
				const fn = jest.fn(async () => null);

				await expect(poll(fn, { interval: 10, timeout: 50 })).rejects.toThrow(
					"Poll timed out",
				);
			});
		});

		describe("getSparkPostTemplate", () => {
			it("should return US donation template for USD", () => {
				const result = getSparkPostTemplate("usd", {}, "donation");
				expect(result).toBe("donation-receipt-2024-usa-stripe");
			});

			it("should return UK donation template for GBP", () => {
				const result = getSparkPostTemplate("gbp", {}, "donation");
				expect(result).toBe("donation-receipt-2024-uk-stripe");
			});

			it("should return null for GBP subscription", () => {
				const result = getSparkPostTemplate("gbp", {}, "subscription");
				expect(result).toBe(null);
			});

			it("should return US subscription template for USD", () => {
				const result = getSparkPostTemplate("usd", {}, "subscription");
				expect(result).toBe("usa-monthly-donation");
			});

			it("should use metadata override", () => {
				const result = getSparkPostTemplate(
					"usd",
					{ sparkPostTemplate: "custom-template" },
					"donation",
				);
				expect(result).toBe("custom-template");
			});

			it("should return null when metadata requests suppression", () => {
				const result = getSparkPostTemplate(
					"usd",
					{ sparkPostTemplate: "none" },
					"donation",
				);
				expect(result).toBe(null);
			});

			it("should default to donation type when not specified", () => {
				const result = getSparkPostTemplate("usd", {});
				expect(result).toBe("donation-receipt-2024-usa-stripe");
			});
		});

		describe("sendThankYouEmail", () => {
			let mockSendEmail;

			beforeEach(() => {
				mockSendEmail = jest.fn().mockResolvedValue(true);
			});

			it("should send email with correct data", async () => {
				const result = await sendThankYouEmail(
					"test-template",
					"TestCampaign",
					"test@example.com",
					"John",
					100,
					"usd",
					mockSendEmail,
				);

				expect(result).toBe(true);
				expect(mockSendEmail).toHaveBeenCalledWith(
					"test-template",
					"test@example.com",
					{ name: "John", amount: "$100.00" },
				);
			});

			it("should format GBP currency symbol", async () => {
				await sendThankYouEmail(
					"test-template",
					"TestCampaign",
					"test@example.com",
					"John",
					50,
					"gbp",
					mockSendEmail,
				);

				expect(mockSendEmail).toHaveBeenCalledWith(
					"test-template",
					"test@example.com",
					{ name: "John", amount: "£50.00" },
				);
			});

			it("should skip email when template is null", async () => {
				const result = await sendThankYouEmail(
					null,
					"TestCampaign",
					"test@example.com",
					"John",
					100,
					"usd",
					mockSendEmail,
				);

				expect(result).toBe(false);
				expect(mockSendEmail).not.toHaveBeenCalled();
			});

			it("should skip email for excluded campaigns", async () => {
				const result = await sendThankYouEmail(
					"test-template",
					"FreedomFoundation",
					"test@example.com",
					"John",
					100,
					"usd",
					mockSendEmail,
				);

				expect(result).toBe(false);
				expect(mockSendEmail).not.toHaveBeenCalled();
			});

			it("should skip email for 2025 EOY campaign", async () => {
				const result = await sendThankYouEmail(
					"test-template",
					"2025 EOY",
					"test@example.com",
					"John",
					100,
					"usd",
					mockSendEmail,
				);

				expect(result).toBe(false);
				expect(mockSendEmail).not.toHaveBeenCalled();
			});

			it("should handle custom excluded campaigns list", async () => {
				const result = await sendThankYouEmail(
					"test-template",
					"CustomExcluded",
					"test@example.com",
					"John",
					100,
					"usd",
					mockSendEmail,
					["CustomExcluded"],
				);

				expect(result).toBe(false);
				expect(mockSendEmail).not.toHaveBeenCalled();
			});
		});
	});

	describe("stepUtils", () => {
		let extractDefaultValues,
			updateStepsWithParams,
			getFieldIdsExcludingRemoved;

		beforeEach(() => {
			jest.resetModules();
			const utils = require("@/app/lib/utils/stepUtils");
			extractDefaultValues = utils.extractDefaultValues;
			updateStepsWithParams = utils.updateStepsWithParams;
			getFieldIdsExcludingRemoved = utils.getFieldIdsExcludingRemoved;
		});

		describe("extractDefaultValues", () => {
			it("should extract default values from steps", () => {
				const steps = [
					{
						fields: [
							{ id: "currency", defaultValue: "gbp" },
							{ id: "amount", defaultValue: 50 },
						],
					},
				];
				const searchParams = new URLSearchParams();

				const { defaultValues, initialCurrency, amountProvided } =
					extractDefaultValues(steps, searchParams);

				expect(defaultValues.currency).toBe("gbp");
				expect(defaultValues.amount).toBe(50);
				expect(initialCurrency).toBe("gbp");
				expect(amountProvided).toBe(false);
			});

			it("should extract values from URL params", () => {
				const steps = [
					{
						fields: [
							{ id: "currency", defaultValue: "gbp" },
							{ id: "amount", defaultValue: 50 },
						],
					},
				];
				const searchParams = new URLSearchParams("?amount=100&currency=usd");

				const { defaultValues, initialCurrency, amountProvided } =
					extractDefaultValues(steps, searchParams);

				expect(defaultValues.currency).toBe("usd");
				expect(defaultValues.amount).toBe("100");
				expect(initialCurrency).toBe("usd");
				expect(amountProvided).toBe(true);
			});

			it("should handle field groups", () => {
				const steps = [
					{
						fields: [
							{
								type: "fieldGroup",
								fields: [
									{ id: "firstName", defaultValue: "John" },
									{ id: "lastName", defaultValue: "Doe" },
								],
							},
						],
					},
				];
				const searchParams = new URLSearchParams();

				const { defaultValues } = extractDefaultValues(steps, searchParams);

				expect(defaultValues.firstName).toBe("John");
				expect(defaultValues.lastName).toBe("Doe");
			});
		});

		describe("updateStepsWithParams", () => {
			it("should update field default values from URL params", () => {
				const steps = [
					{
						fields: [{ id: "campaign", defaultValue: "general" }],
					},
				];
				const searchParams = new URLSearchParams("?campaign=special");

				const updatedSteps = updateStepsWithParams(
					steps,
					searchParams,
					"stripe",
				);

				expect(updatedSteps[0].fields[0].defaultValue).toBe("special");
			});

			it("should remove directDebitStartDate for Stripe gateway", () => {
				const steps = [
					{
						fields: [
							{
								type: "fieldGroup",
								id: "directDebitStartDate",
								fields: [{ id: "day" }],
							},
						],
					},
				];
				const searchParams = new URLSearchParams();

				const updatedSteps = updateStepsWithParams(
					steps,
					searchParams,
					"stripe",
				);

				expect(updatedSteps[0].fields[0]).toBe(null);
			});

			it("should filter frequency options when monthlyAllowed is false", () => {
				const steps = [
					{
						fields: [
							{
								type: "fieldGroup",
								fields: [
									{
										id: "givingFrequency",
										options: [
											{ text: "Monthly", value: "monthly" },
											{ text: "Once", value: "once" },
										],
									},
								],
							},
						],
					},
				];
				const searchParams = new URLSearchParams("?monthlyAllowed=false");

				const updatedSteps = updateStepsWithParams(
					steps,
					searchParams,
					"stripe",
				);

				const frequencyField = updatedSteps[0].fields[0].fields.find(
					(f) => f.id === "givingFrequency",
				);
				expect(frequencyField.options).toEqual([
					{ text: "Once", value: "once" },
				]);
			});
		});

		describe("getFieldIdsExcludingRemoved", () => {
			it("should get all field IDs", () => {
				const fields = [{ id: "field1" }, { id: "field2" }];
				const result = getFieldIdsExcludingRemoved(fields);
				expect(result).toEqual(["field1", "field2"]);
			});

			it("should handle field groups", () => {
				const fields = [
					{
						type: "fieldGroup",
						fields: [{ id: "field1" }, { id: "field2" }],
					},
				];
				const result = getFieldIdsExcludingRemoved(fields);
				expect(result).toEqual(["field1", "field2"]);
			});

			it("should exclude null/undefined fields", () => {
				const fields = [{ id: "field1" }, null, { id: "field2" }, undefined];
				const result = getFieldIdsExcludingRemoved(fields);
				expect(result).toEqual(["field1", "field2"]);
			});

			it("should handle field groups with null subfields", () => {
				const fields = [
					{
						type: "fieldGroup",
						fields: [{ id: "field1" }, null, { id: "field2" }],
					},
				];
				const result = getFieldIdsExcludingRemoved(fields);
				expect(result).toEqual(["field1", "field2"]);
			});
		});
	});
});
