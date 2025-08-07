import { countries } from "./countries";

export const options = {
	frequencyOptions: [
		{ text: "Monthly", value: "monthly" },
		{ text: "Once", value: "once" },
	],
	titleOptions: [
		{ text: "Mr", value: "Mr" },
		{ text: "Mrs", value: "Mrs" },
		{ text: "Miss", value: "Miss" },
		{ text: "Ms", value: "Ms" },
		{ text: "Dr", value: "Dr" },
		{ text: "Bishop", value: "Bishop" },
		{ text: "Friar", value: "Friar" },
		{ text: "Councillor", value: "Councillor" },
		{ text: "Professor", value: "Professor" },
		{ text: "Sir", value: "Sir" },
		{ text: "Lady", value: "Lady" },
	],
	yesNoOptions: [
		{ text: "Yes", value: true },
		{ text: "No", value: false },
	],
	directDebitDayOptions: [
		{ text: "1st", value: 1 },
		{ text: "15th", value: 15 },
		{ text: "25th", value: 25 },
	],
	giftAidOptions: [
		{ text: "Yes", value: true },
		{ text: "No", value: false },
	],
	countryOptions: countries,
	inspirationOptions: [
		{ text: "Faith based", value: "Inspiration_Faith" },
		{ text: "Social media", value: "Inspiration_SocialMedia" },
		{
			text: "I know a Hope for Justice staff member/ volunteer",
			value: "Inspiration_StaffContact",
		},
		{ text: "Gift of celebration", value: "Inspiration_Celebration" },
		{ text: "Passion to end modern slavery", value: "Inspiration_Cause" },
		{ text: "Event or talk", value: "Inspiration_Event" },
		{ text: "Other", value: "Inspiration_Other" },
	],
};
