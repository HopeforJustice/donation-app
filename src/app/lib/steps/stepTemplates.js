import { onlyNumbers } from "@/app/lib/utilities";
import { handlePhoneInput } from "@/app/lib/utilities";
import EmailDrawer from "@/app/ui/icons/EmailDrawer";
import Mail from "@/app/ui/icons/Mail";
import Mobile from "@/app/ui/icons/Mobile";
import Phone from "@/app/ui/icons/Phone";

export const stepTemplates = [
	{
		id: "basicInfo",
		status: "current",
		title: "Your Details:",
		fields: [
			{
				id: "campaign",
				type: "text",
				defaultValue: "Donation App General Campaign",
				hidden: true,
			},
			{
				id: "utm_source",
				type: "text",
				hidden: true,
			},
			{
				id: "utm_medium",
				type: "text",
				hidden: true,
			},
			{
				id: "utm_campaign",
				type: "text",
				hidden: true,
			},
			{
				id: "sparkPostTemplate",
				type: "text",
				hidden: true,
			},
			{
				id: "fund",
				type: "text",
				defaultValue: "unrestricted",
				hidden: true,
			},
			{
				id: "currency",
				type: "text",
				defaultValue: "gbp",
				hidden: true,
			},
			{ id: "givingPreview", type: "givingPreview" },
			{
				type: "fieldGroup",
				id: "givingDetails",
				// descriptionToken: "givingDetailsDescription",
				fields: [
					{
						id: "amount",
						labelToken: "amount",
						type: "amount",
						placeholder: "0.00",
						ariaDescription: "amount-currency",
						onInput: onlyNumbers,
						acceptedCurrencies: [
							{ text: "GBP", value: "gbp" },
							{ text: "USD", value: "usd" },
							// { text: "AUD", value: "aud" },
							// { text: "NOK", value: "nok" },
						],
					},
					{
						id: "givingFrequency",
						type: "select",
						labelToken: "frequency",
						defaultValue: "monthly",
						optionsToken: "frequencyOptions",
					},
				],
			},
			{
				id: "title",
				labelToken: "title",
				type: "select",
				optionsToken: "titleOptions",
				visibilityConditions: {
					currency: "gbp",
				},
			},
			{
				type: "fieldGroup",
				fields: [
					{ id: "firstName", labelToken: "firstName", type: "text" },
					{ id: "lastName", labelToken: "lastName", type: "text" },
				],
			},
			{ id: "email", labelToken: "email", type: "email" },
			{
				id: "phone",
				labelToken: "phoneNumber",
				type: "text",
				onInput: handlePhoneInput,
				descriptionToken: "phoneDescription",
				descriptionAbove: true,
			},
			{
				id: "directDebitStartDate",
				labelToken: "directDebitDay",
				type: "select",
				optionsToken: "directDebitDayOptions",
				descriptionToken: "directDebitStartDateDescription",
				descriptionAbove: true,
				visibilityConditions: {
					currency: "gbp",
					frequency: "monthly",
				},
			},
			{
				id: "inspirationQuestion",
				labelToken: "What inspired you to give?",
				optional: true,
				type: "select",
				optionsToken: "inspirationOptions",
			},
			{
				id: "inspirationDetails",
				labelToken: "Please tell us more",
				type: "textarea",
				optional: true,
			},
		],
	},

	{
		id: "addressDetails",
		status: "upcoming",
		title: "Address Details:",
		descriptionToken: "addressDescription",
		fields: [
			{
				id: "addressSearch",
				labelToken: "addressSearch",
				type: "addressSearch",
			},
			{ id: "address1", labelToken: "address1", type: "text" },
			{ id: "address2", labelToken: "address2", type: "text", optional: true },
			{
				type: "fieldGroup",
				fields: [
					{ id: "townCity", labelToken: "townCity", type: "text" },
					{ id: "postcode", labelToken: "postcode", type: "text" },
				],
			},
			{
				id: "stateCounty",
				labelToken: "countyOrState",
				type: "select",
				optionsToken: "stateCountyOptions",
				visibilityConditions: {
					currency: "usd",
				},
			},
			{
				id: "country",
				label: "Country",
				type: "select",
				optionsToken: "countryOptions",
			},
		],
	},

	{
		id: "giftAid",
		status: "upcoming",
		title: "Gift Aid:",
		descriptionToken: "giftAidDescription",
		fields: [
			{
				id: "giftAid",
				labelToken: "giftAidLabel",
				type: "select",
				optionsToken: "giftAidOptions",
				descriptionToken: "giftAidOptionsDescription",
			},
		],
		visibilityConditions: {
			currency: "gbp",
		},
	},

	{
		id: "preferences",
		status: "upcoming",
		title: "Choose your impact updates",
		subtitle: "Join 44,000+ supporters staying connected",
		descriptionToken: "preferencesDescription",
		fields: [
			{
				type: "fieldGroup",
				id: "contactPreferences",
				descriptionToken: "contactPreferencesDescription",
				columns: 1,
				fields: [
					{
						id: "emailPreference",
						labelToken: "Email impact stories",
						type: "toggle",
						defaultValue: true,
						icon: <EmailDrawer />,
						description:
							"Monthly stories and organisation-wide wins. Our most popular way to stay connected",
					},
					{
						id: "postPreference",
						labelToken: "Premium mailings",
						type: "toggle",
						defaultValue: true,
						icon: <Mail />,
						description:
							"Christmas appeal & urgent campaigns 2-3 times per year",
					},
					{
						id: "smsPreference",
						labelToken: "Text alerts",
						type: "toggle",
						defaultValue: true,
						icon: <Mobile />,
						description:
							"Breaking news when someone gains freedom Rare but powerful moments",
					},
					{
						id: "phonePreference",
						labelToken: "Phone calls",
						type: "toggle",
						defaultValue: true,
						icon: <Phone />,
						description:
							"Any urgent or pressing issues you need to know about. Our quickest way to contact you",
					},
				],
			},
		],
		visibilityConditions: {
			currency: "gbp",
		},
	},
	{
		id: "paymentDetails",
		title: "Choose your payment method",
		fields: [
			{
				id: "stripePayment",
				type: "stripePaymentStep",
				labelToken: null,
				visibilityConditions: ({ currency, frequency }) =>
					!(currency === "gbp" && frequency === "monthly"),
			},
			{
				id: "payPalPaymentStep",
				type: "payPalPaymentStep",
				labelToken: null,
				visibilityConditions: ({ currency, frequency }) =>
					frequency === "once" && (currency === "usd" || currency === "gbp"),
			},
		],
	},
];
