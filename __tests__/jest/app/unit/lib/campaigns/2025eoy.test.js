import EOY2025 from "@/app/lib/campaigns/2025eoy";
import sendEmailByTemplateName from "@/app/lib/sparkpost/sendEmailByTemplateName";

jest.mock("@/app/lib/campaigns/2025eoy");
jest.mock("@/app/lib/sparkpost/sendEmailByTemplateName");

describe("EOY2025 Campaign Workflow", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("should attempt to send a custom sparkpost email with UK currency", async () => {});
});
