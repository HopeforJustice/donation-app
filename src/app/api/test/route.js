// /app/api/test/route.js
import { NextResponse } from "next/server";
import addUpdateSubscriber from "@/app/lib/mailchimp/addUpdateSubscriber";

const constituent = {
	SearchResults: null,
	ConstituentId: "c685916f-83e5-ec11-b5cf-501ac580cd6e",
	ConstituentNumber: 35803,
	IsActive: true,
	DateAdded: "2022-06-06T10:28:42.7184791",
	DateChanged: "2024-10-21T15:05:06.8350902",
	Description: null,
	IsGroup: false,
	ArchiveDate: null,
	ArchiveReason: "",
	TrackingCodes: null,
	OrganisationName: null,
	Title: "Mr",
	FirstName: "James",
	MiddleName: null,
	LastName: "Holt",
	Prefix: null,
	Suffix: null,
	Formerly: null,
	AlsoKnownAs: null,
	DateOfBirth: null,
	NationalIDNumber: null,
	AllowNameSwap: false,
	NoGiftAid: false,
	ExternalKey: null,
	RecruitmentCampaign: "New UK Guardians via website",
	ConstituentType: "Individual",
	Gender: "",
	Salutation: "James",
	LabelName: "Mr James Holt",
	HouseBuildingNumber: "10 Stonegate Crescent",
	AddressLine1: "Testing prefill",
	AddressLine2: "Address",
	Town: "Test City",
	County: "West Yorkshire",
	Country: "United Kingdom",
	PostalCode: "TES734",
	Phone1: "12345",
	Phone2: "07949792166",
	MobilePhone: null,
	JobTitle: null,
	EmailAddress: "james.holt@hopeforjustice.org",
	EmailFormat: null,
	UtmSource: "",
	UtmMedium: "",
	UtmTerm: "",
	UtmContent: "",
	UtmCampaign: "",
};

export async function POST() {
	try {
		const response = await addUpdateSubscriber(
			constituent.EmailAddress,
			constituent.FirstName,
			constituent.LastName,
			"subscribed",
			"uk"
		);
		if (response) {
			return NextResponse.json(response, { status: 200 });
		} else {
			throw new Error("no response");
		}
	} catch (error) {
		console.error("Error in API:", error);
		return NextResponse.json(
			{ message: "Error processing request" },
			{ status: 500 }
		);
	}
}
