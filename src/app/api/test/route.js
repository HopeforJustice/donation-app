// /app/api/test/route.js
import { NextResponse } from "next/server";
import addUpdateSubscriber from "@/app/lib/mailchimp/addUpdateSubscriber";
import { getConstituent } from "@/app/lib/donorfy/getConstituent";
import { getConstituentPreferences } from "@/app/lib/donorfy/getConstituentPreferences";
import { extractPreferences } from "@/app/lib/utilities";

// const constituent = {
// 	SearchResults: null,
// 	ConstituentId: "c685916f-83e5-ec11-b5cf-501ac580cd6e",
// 	ConstituentNumber: 35803,
// 	IsActive: true,
// 	DateAdded: "2022-06-06T10:28:42.7184791",
// 	DateChanged: "2024-10-21T15:05:06.8350902",
// 	Description: null,
// 	IsGroup: false,
// 	ArchiveDate: null,
// 	ArchiveReason: "",
// 	TrackingCodes: null,
// 	OrganisationName: null,
// 	Title: "Mr",
// 	FirstName: "James",
// 	MiddleName: null,
// 	LastName: "Holt",
// 	Prefix: null,
// 	Suffix: null,
// 	Formerly: null,
// 	AlsoKnownAs: null,
// 	DateOfBirth: null,
// 	NationalIDNumber: null,
// 	AllowNameSwap: false,
// 	NoGiftAid: false,
// 	ExternalKey: null,
// 	RecruitmentCampaign: "New UK Guardians via website",
// 	ConstituentType: "Individual",
// 	Gender: "",
// 	Salutation: "James",
// 	LabelName: "Mr James Holt",
// 	HouseBuildingNumber: "10 Stonegate Crescent",
// 	AddressLine1: "Testing prefill",
// 	AddressLine2: "Address",
// 	Town: "Test City",
// 	County: "West Yorkshire",
// 	Country: "United Kingdom",
// 	PostalCode: "TES734",
// 	Phone1: "12345",
// 	Phone2: "07949792166",
// 	MobilePhone: null,
// 	JobTitle: null,
// 	EmailAddress: "james.holt@hopeforjustice.org",
// 	EmailFormat: null,
// 	UtmSource: "",
// 	UtmMedium: "",
// 	UtmTerm: "",
// 	UtmContent: "",
// 	UtmCampaign: "",
// };
const constituentId = "c8869221-4407-ed11-b5cf-0003ff4457ff";
export async function POST() {
	try {
		const data = await getConstituent(constituentId, "uk");

		return NextResponse.json(data, { status: 200 });
	} catch (error) {
		console.error("Error in API:", error);
		return NextResponse.json(
			{ message: "Error processing request" },
			{ status: 500 }
		);
	}
}
