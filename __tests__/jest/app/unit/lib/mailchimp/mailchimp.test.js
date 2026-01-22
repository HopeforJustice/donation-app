// Mock the Mailchimp module
jest.mock("@mailchimp/mailchimp_marketing");
jest.mock("@/app/lib/mailchimp/getMailchimpConfig");
jest.mock("@/app/lib/mailchimp/getList");
jest.mock("@/app/lib/mailchimp/getSubscriberHash");

describe("Mailchimp Functions", () => {
	let mailchimp;
	let getMailchimpConfig;
	let getList;
	let getSubscriberHash;
	let consoleLogSpy;
	let consoleErrorSpy;

	beforeEach(() => {
		// Setup mock mailchimp client
		mailchimp = {
			lists: {
				updateListMemberTags: jest.fn(),
				setListMember: jest.fn(),
				getListMember: jest.fn(),
				deleteListMemberPermanent: jest.fn(),
				getList: jest.fn(),
				getAllLists: jest.fn(),
			},
			ping: {
				get: jest.fn(),
			},
			setConfig: jest.fn(),
		};

		// Import and setup mocks (skip if they were unmocked in a nested describe block)
		getMailchimpConfig =
			require("@/app/lib/mailchimp/getMailchimpConfig").default;
		getList = require("@/app/lib/mailchimp/getList").default;
		getSubscriberHash =
			require("@/app/lib/mailchimp/getSubscriberHash").default;

		if (typeof getMailchimpConfig.mockReturnValue === "function") {
			getMailchimpConfig.mockReturnValue(mailchimp);
		}
		if (typeof getList.mockResolvedValue === "function") {
			getList.mockResolvedValue({ id: "list123", name: "Test List" });
		}
		if (typeof getSubscriberHash.mockReturnValue === "function") {
			getSubscriberHash.mockReturnValue("5d41402abc4b2a76b9719d911017c592");
		}

		// Spy on console methods
		consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
		consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
	});

	afterEach(() => {
		jest.clearAllMocks();
		consoleLogSpy.mockRestore();
		consoleErrorSpy.mockRestore();
	});

	describe("addTag", () => {
		let addTag;

		beforeEach(() => {
			addTag = require("@/app/lib/mailchimp/addTag").default;
		});

		it("should add tag to subscriber with default UK country", async () => {
			mailchimp.lists.updateListMemberTags.mockResolvedValue({});

			await addTag("test@example.com", "Donor");

			expect(getList).toHaveBeenCalledWith("uk");
			expect(getSubscriberHash).toHaveBeenCalledWith("test@example.com");
			expect(mailchimp.lists.updateListMemberTags).toHaveBeenCalledWith(
				"list123",
				"5d41402abc4b2a76b9719d911017c592",
				{
					tags: [{ name: "Donor", status: "active" }],
				},
			);
		});

		it("should add tag to subscriber with US country", async () => {
			mailchimp.lists.updateListMemberTags.mockResolvedValue({});

			await addTag("test@example.com", "Newsletter", "us");

			expect(getList).toHaveBeenCalledWith("us");
			expect(mailchimp.lists.updateListMemberTags).toHaveBeenCalledWith(
				"list123",
				"5d41402abc4b2a76b9719d911017c592",
				{
					tags: [{ name: "Newsletter", status: "active" }],
				},
			);
		});

		it("should throw error when Mailchimp API fails", async () => {
			const apiError = new Error("API Error");
			mailchimp.lists.updateListMemberTags.mockRejectedValue(apiError);

			await expect(addTag("test@example.com", "Donor")).rejects.toThrow(
				"Add Tag to Mailchimp subscriber failed, tag: Donor, error: API Error",
			);
		});

		it("should log list id and subscriber hash", async () => {
			mailchimp.lists.updateListMemberTags.mockResolvedValue({});

			await addTag("test@example.com", "Donor");

			expect(consoleLogSpy).toHaveBeenCalledWith(
				"list123",
				"5d41402abc4b2a76b9719d911017c592",
			);
		});
	});

	describe("deleteTag", () => {
		let deleteTag;

		beforeEach(() => {
			deleteTag = require("@/app/lib/mailchimp/deleteTag").default;
		});

		it("should delete tag from subscriber with default UK country", async () => {
			mailchimp.lists.updateListMemberTags.mockResolvedValue({});

			await deleteTag("test@example.com", "OldTag");

			expect(getList).toHaveBeenCalledWith("uk");
			expect(getSubscriberHash).toHaveBeenCalledWith("test@example.com");
			expect(mailchimp.lists.updateListMemberTags).toHaveBeenCalledWith(
				"list123",
				"5d41402abc4b2a76b9719d911017c592",
				{
					tags: [{ name: "OldTag", status: "inactive" }],
				},
			);
		});

		it("should delete tag from subscriber with US country", async () => {
			mailchimp.lists.updateListMemberTags.mockResolvedValue({});

			await deleteTag("test@example.com", "Expired", "us");

			expect(getList).toHaveBeenCalledWith("us");
			expect(mailchimp.lists.updateListMemberTags).toHaveBeenCalledWith(
				"list123",
				"5d41402abc4b2a76b9719d911017c592",
				{
					tags: [{ name: "Expired", status: "inactive" }],
				},
			);
		});

		it("should throw error when Mailchimp API fails", async () => {
			const apiError = new Error("Tag deletion failed");
			mailchimp.lists.updateListMemberTags.mockRejectedValue(apiError);

			await expect(deleteTag("test@example.com", "OldTag")).rejects.toThrow(
				"Delete Tag from Mailchimp subscriber failed, tag: OldTag, error: Tag deletion failed",
			);
		});
	});

	describe("addUpdateSubscriber", () => {
		let addUpdateSubscriber;

		beforeEach(() => {
			addUpdateSubscriber =
				require("@/app/lib/mailchimp/addUpdateSubscriber").default;
		});

		it("should add/update subscriber with UK country and interests", async () => {
			const mockResult = { id: "sub123", email_address: "test@example.com" };
			mailchimp.lists.setListMember.mockResolvedValue(mockResult);

			const result = await addUpdateSubscriber(
				"test@example.com",
				"John",
				"Doe",
				"subscribed",
				"uk",
			);

			expect(mailchimp.lists.setListMember).toHaveBeenCalledWith(
				"list123",
				"5d41402abc4b2a76b9719d911017c592",
				{
					email_address: "test@example.com",
					status_if_new: "subscribed",
					merge_fields: {
						FNAME: "John",
						LNAME: "Doe",
					},
					interests: { "60a2c211ce": true },
				},
			);
			expect(result).toEqual(mockResult);
		});

		it("should add/update subscriber with US country and interests", async () => {
			const mockResult = { id: "sub456", email_address: "test@example.com" };
			mailchimp.lists.setListMember.mockResolvedValue(mockResult);

			const result = await addUpdateSubscriber(
				"test@example.com",
				"Jane",
				"Smith",
				"pending",
				"us",
			);

			expect(mailchimp.lists.setListMember).toHaveBeenCalledWith(
				"list123",
				"5d41402abc4b2a76b9719d911017c592",
				expect.objectContaining({
					interests: { b90c533e0c: true },
				}),
			);
			expect(result).toEqual(mockResult);
		});

		it("should include additional merge fields", async () => {
			const mockResult = { id: "sub789" };
			mailchimp.lists.setListMember.mockResolvedValue(mockResult);

			await addUpdateSubscriber(
				"test@example.com",
				"Bob",
				"Jones",
				"subscribed",
				"uk",
				{ PHONE: "07123456789", COMPANY: "Test Corp" },
			);

			expect(mailchimp.lists.setListMember).toHaveBeenCalledWith(
				"list123",
				"5d41402abc4b2a76b9719d911017c592",
				expect.objectContaining({
					merge_fields: {
						FNAME: "Bob",
						LNAME: "Jones",
						PHONE: "07123456789",
						COMPANY: "Test Corp",
					},
				}),
			);
		});

		it("should throw rate limiting error with clear message", async () => {
			const rateLimitError = new Error("Rate limited");
			rateLimitError.response = {
				text: JSON.stringify({
					detail: "This email has signed up to a lot of lists very recently",
				}),
			};
			mailchimp.lists.setListMember.mockRejectedValue(rateLimitError);

			await expect(
				addUpdateSubscriber("test@example.com", "John", "Doe", "subscribed"),
			).rejects.toThrow(
				"Mailchimp rate limiting, the email has been added to lists too frequently",
			);

			expect(consoleErrorSpy).toHaveBeenCalled();
		});

		it("should throw generic error when API fails", async () => {
			const apiError = new Error("API Connection Failed");
			mailchimp.lists.setListMember.mockRejectedValue(apiError);

			await expect(
				addUpdateSubscriber("test@example.com", "John", "Doe", "subscribed"),
			).rejects.toThrow(
				"Add/Update Mailchimp subscriber failed, error: API Connection Failed",
			);
		});

		it("should handle response body instead of text", async () => {
			const rateLimitError = new Error("Rate limited");
			rateLimitError.response = {
				body: JSON.stringify({
					detail: "This email has signed up to a lot of lists very recently",
				}),
			};
			mailchimp.lists.setListMember.mockRejectedValue(rateLimitError);

			await expect(
				addUpdateSubscriber("test@example.com", "John", "Doe", "subscribed"),
			).rejects.toThrow("Mailchimp rate limiting");
		});

		it("should log detailed error information", async () => {
			const apiError = new Error("Validation error");
			apiError.status = 400;
			apiError.detail = "Invalid email";
			apiError.title = "Bad Request";
			mailchimp.lists.setListMember.mockRejectedValue(apiError);

			await expect(
				addUpdateSubscriber("invalid", "John", "Doe", "subscribed"),
			).rejects.toThrow();

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				"Detailed Mailchimp error:",
				expect.objectContaining({
					message: "Validation error",
					status: 400,
					detail: "Invalid email",
					title: "Bad Request",
				}),
			);
		});
	});

	describe("getSubscriber", () => {
		let getSubscriber;

		beforeEach(() => {
			getSubscriber = require("@/app/lib/mailchimp/getSubscriber").default;
		});

		it("should get subscriber with default UK country", async () => {
			const mockSubscriber = {
				id: "sub123",
				email_address: "test@example.com",
				status: "subscribed",
			};
			mailchimp.lists.getListMember.mockResolvedValue(mockSubscriber);

			const result = await getSubscriber("test@example.com");

			expect(getList).toHaveBeenCalledWith("uk");
			expect(getSubscriberHash).toHaveBeenCalledWith("test@example.com");
			expect(mailchimp.lists.getListMember).toHaveBeenCalledWith(
				"list123",
				"5d41402abc4b2a76b9719d911017c592",
			);
			expect(result).toEqual(mockSubscriber);
		});

		it("should get subscriber with US country", async () => {
			const mockSubscriber = {
				id: "sub456",
				email_address: "test@example.com",
			};
			mailchimp.lists.getListMember.mockResolvedValue(mockSubscriber);

			const result = await getSubscriber("test@example.com", "us");

			expect(getList).toHaveBeenCalledWith("us");
			expect(result).toEqual(mockSubscriber);
		});

		it("should throw error when subscriber not found", async () => {
			const notFoundError = new Error("Subscriber not found");
			mailchimp.lists.getListMember.mockRejectedValue(notFoundError);

			await expect(getSubscriber("nonexistent@example.com")).rejects.toThrow(
				"Get subscriber failed, error: Subscriber not found",
			);
		});
	});

	describe("deleteSubscriber", () => {
		let deleteSubscriber;

		beforeEach(() => {
			deleteSubscriber =
				require("@/app/lib/mailchimp/deleteSubscriber").default;
		});

		it("should delete subscriber with default UK country", async () => {
			mailchimp.lists.deleteListMemberPermanent.mockResolvedValue({});

			const result = await deleteSubscriber("test@example.com");

			expect(getList).toHaveBeenCalledWith("uk");
			expect(getSubscriberHash).toHaveBeenCalledWith("test@example.com");
			expect(mailchimp.lists.deleteListMemberPermanent).toHaveBeenCalledWith(
				"list123",
				"5d41402abc4b2a76b9719d911017c592",
			);
			expect(result).toEqual({});
		});

		it("should delete subscriber with US country", async () => {
			mailchimp.lists.deleteListMemberPermanent.mockResolvedValue({
				success: true,
			});

			const result = await deleteSubscriber("test@example.com", "us");

			expect(getList).toHaveBeenCalledWith("us");
			expect(result).toEqual({ success: true });
		});

		it("should throw error when deletion fails", async () => {
			const deleteError = new Error("Deletion failed");
			mailchimp.lists.deleteListMemberPermanent.mockRejectedValue(deleteError);

			await expect(deleteSubscriber("test@example.com")).rejects.toThrow(
				"Delete subscriber failed, error: Deletion failed",
			);
		});
	});

	describe("getSubscriberHash", () => {
		let getSubscriberHashReal;

		beforeEach(() => {
			// Reset and unmock for this describe block
			jest.resetModules();
			jest.unmock("@/app/lib/mailchimp/getSubscriberHash");
			getSubscriberHashReal =
				require("@/app/lib/mailchimp/getSubscriberHash").default;
		});

		it("should generate MD5 hash of lowercase email", () => {
			const hash = getSubscriberHashReal("Test@Example.COM");

			// MD5 hash of "test@example.com"
			expect(hash).toBe("55502f40dc8b7c769880b10874abc9d0");
		});

		it("should generate same hash for same email regardless of case", () => {
			const hash1 = getSubscriberHashReal("test@example.com");
			const hash2 = getSubscriberHashReal("TEST@EXAMPLE.COM");
			const hash3 = getSubscriberHashReal("Test@Example.Com");

			expect(hash1).toBe(hash2);
			expect(hash2).toBe(hash3);
		});
	});

	describe("getMailchimpConfig", () => {
		let getMailchimpConfigReal;
		let mailchimpMock;

		beforeEach(() => {
			jest.resetModules();
			jest.unmock("@/app/lib/mailchimp/getMailchimpConfig");
			process.env.MC_API_KEY = "test-api-key-123";

			mailchimpMock = require("@mailchimp/mailchimp_marketing");
			getMailchimpConfigReal =
				require("@/app/lib/mailchimp/getMailchimpConfig").default;
		});

		afterEach(() => {
			delete process.env.MC_API_KEY;
		});

		it("should configure mailchimp with API key and server", () => {
			const result = getMailchimpConfigReal();

			expect(mailchimpMock.setConfig).toHaveBeenCalledWith({
				apiKey: "test-api-key-123",
				server: "us19",
			});
			expect(result).toBe(mailchimpMock);
		});
	});

	describe("getList", () => {
		let getListReal;
		let mailchimpMock;

		beforeEach(() => {
			jest.resetModules();
			jest.unmock("@/app/lib/mailchimp/getList");
			jest.unmock("@/app/lib/mailchimp/getMailchimpConfig");

			process.env.MC_UK_AUDIENCE_ID = "uk-list-123";
			process.env.MC_US_AUDIENCE_ID = "us-list-456";
			process.env.MC_API_KEY = "test-api-key-123";

			// Get the mocked mailchimp module
			mailchimpMock = require("@mailchimp/mailchimp_marketing");

			// Setup mock methods
			mailchimpMock.lists.getList = jest.fn();

			getListReal = require("@/app/lib/mailchimp/getList").default;
		});

		afterEach(() => {
			delete process.env.MC_UK_AUDIENCE_ID;
			delete process.env.MC_US_AUDIENCE_ID;
			delete process.env.MC_API_KEY;
		});

		it("should get UK list by default", async () => {
			const mockList = { id: "uk-list-123", name: "UK List" };
			mailchimpMock.lists.getList.mockResolvedValue(mockList);

			const result = await getListReal();

			expect(mailchimpMock.lists.getList).toHaveBeenCalledWith("uk-list-123");
			expect(result).toEqual(mockList);
		});

		it("should get UK list when country is uk", async () => {
			const mockList = { id: "uk-list-123", name: "UK List" };
			mailchimpMock.lists.getList.mockResolvedValue(mockList);

			const result = await getListReal("uk");

			expect(mailchimpMock.lists.getList).toHaveBeenCalledWith("uk-list-123");
			expect(result).toEqual(mockList);
		});

		it("should get US list when country is us", async () => {
			const mockList = { id: "us-list-456", name: "US List" };
			mailchimpMock.lists.getList.mockResolvedValue(mockList);

			const result = await getListReal("us");

			expect(mailchimpMock.lists.getList).toHaveBeenCalledWith("us-list-456");
			expect(result).toEqual(mockList);
		});
	});

	describe("getAllLists", () => {
		let getAllListsReal;
		let mailchimpMock;

		beforeEach(() => {
			jest.resetModules();
			jest.unmock("@/app/lib/mailchimp/getAllLists");
			jest.unmock("@/app/lib/mailchimp/getMailchimpConfig");

			process.env.MC_API_KEY = "test-api-key-123";

			// Get the mocked mailchimp module
			mailchimpMock = require("@mailchimp/mailchimp_marketing");
			mailchimpMock.lists.getAllLists = jest.fn();

			getAllListsReal = require("@/app/lib/mailchimp/getAllLists").default;
		});

		afterEach(() => {
			delete process.env.MC_API_KEY;
		});

		it("should get all lists", async () => {
			const mockLists = {
				lists: [
					{ id: "list1", name: "List 1" },
					{ id: "list2", name: "List 2" },
				],
			};
			mailchimpMock.lists.getAllLists.mockResolvedValue(mockLists);

			const result = await getAllListsReal();

			expect(mailchimpMock.lists.getAllLists).toHaveBeenCalled();
			expect(result).toEqual(mockLists);
		});
	});

	describe("mailchimpPing", () => {
		let mailchimpPingReal;
		let mailchimpMock;

		beforeEach(() => {
			jest.resetModules();
			jest.unmock("@/app/lib/mailchimp/ping");
			jest.unmock("@/app/lib/mailchimp/getMailchimpConfig");

			process.env.MC_API_KEY = "test-api-key-123";

			// Get the mocked mailchimp module
			mailchimpMock = require("@mailchimp/mailchimp_marketing");
			mailchimpMock.ping.get = jest.fn();

			mailchimpPingReal = require("@/app/lib/mailchimp/ping").default;
		});

		afterEach(() => {
			delete process.env.MC_API_KEY;
		});

		it("should ping Mailchimp API", async () => {
			const mockResponse = { health_status: "Everything's Chimpy!" };
			mailchimpMock.ping.get.mockResolvedValue(mockResponse);

			const result = await mailchimpPingReal();

			expect(mailchimpMock.ping.get).toHaveBeenCalled();
			expect(result).toEqual(mockResponse);
		});
	});
});
