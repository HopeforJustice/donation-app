import { onlyNumbers } from "@/app/lib/utilities";

export const steps = [
	{
		id: "step1",
		status: "current",
		title: "Your Details:",
		fields: [
			{
				id: "givingPreview",
				type: "givingPreview",
			},
			{
				type: "fieldGroup",
				id: "givingDetails",
				description: (
					<p>
						This page is set up to take monthly payments in GBP via Direct
						Debit. If you are looking to donate in a different way please visit
						our{" "}
						<a className="underline" href="https://hopeforjustice.org/donate">
							donate page
						</a>
					</p>
				),
				fields: [
					{
						id: "amount",
						label: "Amount",
						type: "amount",
						placeholder: "0.00",
						ariaDescription: "amount-currency",
						extraClasses: "",
						extraInputClasses: "pl-7",
						onInput: onlyNumbers,
						acceptedCurrencies: [
							// { text: "USD", value: "usd" }, //will add in future
							{ text: "GBP", value: "gbp", default: true },
							// { text: "NOK", value: "nok" }, //will add in future
							// { text: "AUD", value: "aud" }, //will add in future
						],
					},
					//changing frequency will add in future
					{
						id: "givingFrequency",
						type: "select",
						label: "Frequency",
						defaultValue: "monthly",
						options: [
							{ text: "Monthly", value: "monthly" },
							// { text: "Once", value: "once" },
						],
					},
					{
						id: "currency",
						type: "text",
						defaultValue: "gbp",
						hidden: true,
					},
				],
			},
			{
				id: "title",
				label: "Title",
				type: "select",
				options: [
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
				optional: true,
			},
			{
				type: "fieldGroup",
				fields: [
					{
						id: "firstName",
						label: "First name",
						type: "text",
					},
					{ id: "lastName", label: "Last name", type: "text" },
				],
			},
			{ id: "email", label: "Email", type: "email" },
			{
				id: "directDebitStartDate",
				label:
					"On what date each month would you like your payment to be taken?",
				type: "select",
				options: [
					{ text: "1st", value: 1 },
					{ text: "15th", value: 15 },
					{ text: "25th", value: 25 },
					{ text: "30th", value: 30 },
				],
				description:
					"Please note: The exact date that your gift will be taken by Direct Debit can depend on your bank and other factors, including weekends and bank holidays.",
			},
		],
	},

	{
		id: "step2",
		status: "upcoming",
		title: "Address Details:",
		description:
			"We need this to set up your monthly Direct Debit gift. We will not send you anything in the post unless you choose to hear from us in this way.",
		fields: [
			{ id: "address1", label: "Address Line 1", type: "text" },
			{ id: "address2", label: "Address Line 2", type: "text", optional: true },
			{
				type: "fieldGroup",
				fields: [
					{ id: "townCity", label: "Town/City", type: "text" },
					{ id: "postcode", label: "Postcode", type: "text" },
				],
			},

			{
				id: "country",
				label: "Country",
				type: "select",
				defaultValue: "United Kingdom",
				options: [
					{ text: "Afghanistan", value: "Afghanistan" },
					{ text: "Albania", value: "Albania" },
					{ text: "Algeria", value: "Algeria" },
					{ text: "American Samoa", value: "American Samoa" },
					{ text: "Andorra", value: "Andorra" },
					{ text: "Angola", value: "Angola" },
					{ text: "Anguilla", value: "Anguilla" },
					{ text: "Antarctica", value: "Antarctica" },
					{ text: "Antigua and Barbuda", value: "Antigua and Barbuda" },
					{ text: "Argentina", value: "Argentina" },
					{ text: "Armenia", value: "Armenia" },
					{ text: "Aruba", value: "Aruba" },
					{ text: "Australia", value: "Australia" },
					{ text: "Austria", value: "Austria" },
					{ text: "Azerbaijan", value: "Azerbaijan" },
					{ text: "Bahamas", value: "Bahamas" },
					{ text: "Bahrain", value: "Bahrain" },
					{ text: "Bangladesh", value: "Bangladesh" },
					{ text: "Barbados", value: "Barbados" },
					{ text: "Belarus", value: "Belarus" },
					{ text: "Belgium", value: "Belgium" },
					{ text: "Belize", value: "Belize" },
					{ text: "Benin", value: "Benin" },
					{ text: "Bermuda", value: "Bermuda" },
					{ text: "Bhutan", value: "Bhutan" },
					{ text: "Bolivia", value: "Bolivia" },
					{
						text: "Bonaire, Saint Eustatius and Saba",
						value: "Bonaire, Saint Eustatius and Saba",
					},
					{ text: "Bosnia and Herzegovina", value: "Bosnia and Herzegovina" },
					{ text: "Botswana", value: "Botswana" },
					{ text: "Bouvet Island", value: "Bouvet Island" },
					{ text: "Brazil", value: "Brazil" },
					{
						text: "British Indian Ocean Territory",
						value: "British Indian Ocean Territory",
					},
					{ text: "Brunei Darussalam", value: "Brunei Darussalam" },
					{ text: "Bulgaria", value: "Bulgaria" },
					{ text: "Burkina Faso", value: "Burkina Faso" },
					{ text: "Burundi", value: "Burundi" },
					{ text: "Cambodia", value: "Cambodia" },
					{ text: "Cameroon", value: "Cameroon" },
					{ text: "Canada", value: "Canada" },
					{ text: "Cape Verde", value: "Cape Verde" },
					{ text: "Cayman Islands", value: "Cayman Islands" },
					{
						text: "Central African Republic",
						value: "Central African Republic",
					},
					{ text: "Chad", value: "Chad" },
					{ text: "Chile", value: "Chile" },
					{ text: "China", value: "China" },
					{ text: "Christmas Island", value: "Christmas Island" },
					{ text: "Cocos (Keeling) Islands", value: "Cocos (Keeling) Islands" },
					{ text: "Colombia", value: "Colombia" },
					{ text: "Comoros", value: "Comoros" },
					{ text: "Congo", value: "Congo" },
					{
						text: "Congo, the Democratic Republic of the",
						value: "Congo, the Democratic Republic of the",
					},
					{ text: "Cook Islands", value: "Cook Islands" },
					{ text: "Costa Rica", value: "Costa Rica" },
					{ text: "Croatia", value: "Croatia" },
					{ text: "Cuba", value: "Cuba" },
					{ text: "Curaçao", value: "Curaçao" },
					{ text: "Cyprus", value: "Cyprus" },
					{ text: "Czech Republic", value: "Czech Republic" },
					{ text: "Côte D'ivoire", value: "Côte D'ivoire" },
					{ text: "Denmark", value: "Denmark" },
					{ text: "Djibouti", value: "Djibouti" },
					{ text: "Dominica", value: "Dominica" },
					{ text: "Dominican Republic", value: "Dominican Republic" },
					{ text: "Ecuador", value: "Ecuador" },
					{ text: "Egypt", value: "Egypt" },
					{ text: "El Salvador", value: "El Salvador" },
					{ text: "Equatorial Guinea", value: "Equatorial Guinea" },
					{ text: "Eritrea", value: "Eritrea" },
					{ text: "Estonia", value: "Estonia" },
					{ text: "Ethiopia", value: "Ethiopia" },
					{
						text: "Falkland Islands (Malvinas)",
						value: "Falkland Islands (Malvinas)",
					},
					{ text: "Faroe Islands", value: "Faroe Islands" },
					{ text: "Fiji", value: "Fiji" },
					{ text: "Finland", value: "Finland" },
					{ text: "France", value: "France" },
					{ text: "French Guiana", value: "French Guiana" },
					{ text: "French Polynesia", value: "French Polynesia" },
					{
						text: "French Southern Territories",
						value: "French Southern Territories",
					},
					{ text: "Gabon", value: "Gabon" },
					{ text: "Gambia", value: "Gambia" },
					{ text: "Georgia", value: "Georgia" },
					{ text: "Germany", value: "Germany" },
					{ text: "Ghana", value: "Ghana" },
					{ text: "Gibraltar", value: "Gibraltar" },
					{ text: "Greece", value: "Greece" },
					{ text: "Greenland", value: "Greenland" },
					{ text: "Grenada", value: "Grenada" },
					{ text: "Guadeloupe", value: "Guadeloupe" },
					{ text: "Guam", value: "Guam" },
					{ text: "Guatemala", value: "Guatemala" },
					{ text: "Guernsey", value: "Guernsey" },
					{ text: "Guinea", value: "Guinea" },
					{ text: "Guinea-Bissau", value: "Guinea-Bissau" },
					{ text: "Guyana", value: "Guyana" },
					{ text: "Haiti", value: "Haiti" },
					{
						text: "Heard Island and McDonald Islands",
						value: "Heard Island and McDonald Islands",
					},
					{ text: "Holland", value: "Holland" },
					{
						text: "Holy See (Vatican City State)",
						value: "Holy See (Vatican City State)",
					},
					{ text: "Honduras", value: "Honduras" },
					{ text: "Hong Kong", value: "Hong Kong" },
					{ text: "Hungary", value: "Hungary" },
					{ text: "Iceland", value: "Iceland" },
					{ text: "India", value: "India" },
					{ text: "Indonesia", value: "Indonesia" },
					{
						text: "Iran, Islamic Republic Of",
						value: "Iran, Islamic Republic Of",
					},
					{ text: "Iraq", value: "Iraq" },
					{ text: "Ireland", value: "Ireland" },
					{ text: "Isle of Man", value: "Isle of Man" },
					{ text: "Israel", value: "Israel" },
					{ text: "Italy", value: "Italy" },
					{ text: "Jamaica", value: "Jamaica" },
					{ text: "Japan", value: "Japan" },
					{ text: "Jersey", value: "Jersey" },
					{ text: "Jordan", value: "Jordan" },
					{ text: "Kazakhstan", value: "Kazakhstan" },
					{ text: "Kenya", value: "Kenya" },
					{ text: "Kiribati", value: "Kiribati" },
					{ text: "Kuwait", value: "Kuwait" },
					{ text: "Kyrgyzstan", value: "Kyrgyzstan" },
					{ text: "Laos", value: "Laos" },
					{ text: "Latvia", value: "Latvia" },
					{ text: "Lebanon", value: "Lebanon" },
					{ text: "Lesotho", value: "Lesotho" },
					{ text: "Liberia", value: "Liberia" },
					{ text: "Libya", value: "Libya" },
					{ text: "Liechtenstein", value: "Liechtenstein" },
					{ text: "Lithuania", value: "Lithuania" },
					{ text: "Luxembourg", value: "Luxembourg" },
					{ text: "Macao", value: "Macao" },
					{ text: "Macedonia", value: "Macedonia" },
					{ text: "Madagascar", value: "Madagascar" },
					{ text: "Malawi", value: "Malawi" },
					{ text: "Malaysia", value: "Malaysia" },
					{ text: "Maldives", value: "Maldives" },
					{ text: "Mali", value: "Mali" },
					{ text: "Malta", value: "Malta" },
					{ text: "Marshall Islands", value: "Marshall Islands" },
					{ text: "Martinique", value: "Martinique" },
					{ text: "Mauritania", value: "Mauritania" },
					{ text: "Mauritius", value: "Mauritius" },
					{ text: "Mayotte", value: "Mayotte" },
					{ text: "Mexico", value: "Mexico" },
					{ text: "Micronesia", value: "Micronesia" },
					{ text: "Moldova", value: "Moldova" },
					{ text: "Monaco", value: "Monaco" },
					{ text: "Mongolia", value: "Mongolia" },
					{ text: "Montenegro", value: "Montenegro" },
					{ text: "Montserrat", value: "Montserrat" },
					{ text: "Morocco", value: "Morocco" },
					{ text: "Mozambique", value: "Mozambique" },
					{ text: "Myanmar", value: "Myanmar" },
					{ text: "Namibia", value: "Namibia" },
					{ text: "Nauru", value: "Nauru" },
					{ text: "Nepal", value: "Nepal" },
					{ text: "Netherlands", value: "Netherlands" },
					{ text: "New Caledonia", value: "New Caledonia" },
					{ text: "New Zealand", value: "New Zealand" },
					{ text: "Nicaragua", value: "Nicaragua" },
					{ text: "Niger", value: "Niger" },
					{ text: "Nigeria", value: "Nigeria" },
					{ text: "Niue", value: "Niue" },
					{ text: "Norfolk Island", value: "Norfolk Island" },
					{ text: "North Korea", value: "North Korea" },
					{
						text: "Northern Mariana Islands",
						value: "Northern Mariana Islands",
					},
					{ text: "Norway", value: "Norway" },
					{ text: "Oman", value: "Oman" },
					{ text: "Pakistan", value: "Pakistan" },
					{ text: "Palau", value: "Palau" },
					{
						text: "Palestinian Territory, Occupied",
						value: "Palestinian Territory, Occupied",
					},
					{ text: "Panama", value: "Panama" },
					{ text: "Papua New Guinea", value: "Papua New Guinea" },
					{ text: "Paraguay", value: "Paraguay" },
					{ text: "Peru", value: "Peru" },
					{ text: "Philippines", value: "Philippines" },
					{ text: "Pitcairn", value: "Pitcairn" },
					{ text: "Poland", value: "Poland" },
					{ text: "Portugal", value: "Portugal" },
					{ text: "Puerto Rico", value: "Puerto Rico" },
					{ text: "Qatar", value: "Qatar" },
					{ text: "Romania", value: "Romania" },
					{ text: "Russian Federation", value: "Russian Federation" },
					{ text: "Rwanda", value: "Rwanda" },
					{ text: "Réunion", value: "Réunion" },
					{ text: "Saint Barthélemy", value: "Saint Barthélemy" },
					{
						text: "Saint Helena, Ascension and Tristan da Cunha",
						value: "Saint Helena, Ascension and Tristan da Cunha",
					},
					{ text: "Saint Kitts and Nevis", value: "Saint Kitts and Nevis" },
					{ text: "Saint Lucia", value: "Saint Lucia" },
					{
						text: "Saint Martin (French part)",
						value: "Saint Martin (French part)",
					},
					{
						text: "Saint Pierre and Miquelon",
						value: "Saint Pierre and Miquelon",
					},
					{
						text: "Saint Vincent and the Grenadines",
						value: "Saint Vincent and the Grenadines",
					},
					{ text: "Samoa", value: "Samoa" },
					{ text: "San Marino", value: "San Marino" },
					{ text: "Sao Tome and Principe", value: "Sao Tome and Principe" },
					{ text: "Saudi Arabia", value: "Saudi Arabia" },
					{ text: "Senegal", value: "Senegal" },
					{ text: "Serbia", value: "Serbia" },
					{ text: "Seychelles", value: "Seychelles" },
					{ text: "Sierra Leone", value: "Sierra Leone" },
					{ text: "Singapore", value: "Singapore" },
					{
						text: "Sint Maarten (Dutch part)",
						value: "Sint Maarten (Dutch part)",
					},
					{ text: "Slovakia", value: "Slovakia" },
					{ text: "Slovenia", value: "Slovenia" },
					{ text: "Solomon Islands", value: "Solomon Islands" },
					{ text: "Somalia", value: "Somalia" },
					{ text: "South Africa", value: "South Africa" },
					{
						text: "South Georgia and the South Sandwich Islands",
						value: "South Georgia and the South Sandwich Islands",
					},
					{ text: "South Korea", value: "South Korea" },
					{ text: "South Sudan", value: "South Sudan" },
					{ text: "Spain", value: "Spain" },
					{ text: "Sri Lanka", value: "Sri Lanka" },
					{ text: "Sudan", value: "Sudan" },
					{ text: "Suriname", value: "Suriname" },
					{ text: "Svalbard and Jan Mayen", value: "Svalbard and Jan Mayen" },
					{ text: "Swaziland", value: "Swaziland" },
					{ text: "Sweden", value: "Sweden" },
					{ text: "Switzerland", value: "Switzerland" },
					{ text: "Syrian Arab Republic", value: "Syrian Arab Republic" },
					{
						text: "Taiwan, Province Of China",
						value: "Taiwan, Province Of China",
					},
					{ text: "Tajikistan", value: "Tajikistan" },
					{ text: "Tanzania", value: "Tanzania" },
					{ text: "Thailand", value: "Thailand" },
					{ text: "Timor-Leste", value: "Timor-Leste" },
					{ text: "Togo", value: "Togo" },
					{ text: "Tokelau", value: "Tokelau" },
					{ text: "Tonga", value: "Tonga" },
					{ text: "Trinidad and Tobago", value: "Trinidad and Tobago" },
					{ text: "Tunisia", value: "Tunisia" },
					{ text: "Turkey", value: "Turkey" },
					{ text: "Turkmenistan", value: "Turkmenistan" },
					{
						text: "Turks and Caicos Islands",
						value: "Turks and Caicos Islands",
					},
					{ text: "Tuvalu", value: "Tuvalu" },
					{ text: "Uganda", value: "Uganda" },
					{ text: "Ukraine", value: "Ukraine" },
					{ text: "United Arab Emirates", value: "United Arab Emirates" },
					{ text: "United Kingdom", value: "United Kingdom", selected: true },
					{
						text: "United States Minor Outlying Islands",
						value: "United States Minor Outlying Islands",
					},
					{ text: "United States", value: "United States" },
					{ text: "Uruguay", value: "Uruguay" },
					{ text: "Uzbekistan", value: "Uzbekistan" },
					{ text: "Vanuatu", value: "Vanuatu" },
					{ text: "Venezuela", value: "Venezuela" },
					{ text: "Vietnam", value: "Vietnam" },
					{ text: "Virgin Islands, British", value: "Virgin Islands, British" },
					{ text: "Virgin Islands, U.S.", value: "Virgin Islands, U.S." },
					{ text: "Wallis and Futuna", value: "Wallis and Futuna" },
					{ text: "Western Sahara", value: "Western Sahara" },
					{ text: "Yemen", value: "Yemen" },
					{ text: "Zambia", value: "Zambia" },
					{ text: "Zimbabwe", value: "Zimbabwe" },
					{ text: "Åland Islands", value: "Åland Islands" },
				],
			},
		],
	},

	{
		id: "step3",
		status: "upcoming",
		title: "Gift Aid:",
		description:
			"Boost your monthly gifts by 25p for every £1 you donate, at no extra cost to you.",
		fields: [
			{
				id: "giftAid",
				label: "Do you want to Gift Aid your monthly donation?",
				type: "select",
				options: [
					{ text: "Yes", value: true },
					{ text: "No", value: false },
				],
				description: [
					`Please add Gift Aid to all donations I’ve made to Hope for Justice in the past four years and all donations in future until I notify Hope for Justice otherwise.`,
					`By selecting 'Yes', I confirm that I am a UK taxpayer and understand that if I pay less Income Tax and/or Capital Gains Tax than the amount of Gift Aid claimed on all my donations in the tax year, it is my responsibility to pay any difference. I confirm that this is my own money and I am not paying over donations made by third parties such as monies collected at an event, a company donation or a donation from a friend or family member. I am not receiving anything in return for my donation such as a book, prize or ticket. I am not making a donation as part of a sweepstake, raffle or lottery.`,
				],
			},
		],
	},

	{
		id: "step4",
		status: "upcoming",
		title: "Hear about your impact",
		description:
			"We would love for you to hear about the life-changing difference that your donation will make and more ways you can support this work. Can we contact you via:",
		fields: [
			{
				type: "fieldGroup",
				description: [
					<p>
						Select &apos;Yes&apos; if you wish Hope for Justice to contact you via that
						method for the following purposes: To keep you informed of our
						ongoing activities, news, campaigns and appeals; and to invite you
						to events we think might interest you. You can unsubscribe from
						receiving communications at any time, or change your preferences,
						at:{" "}
						<a
							href="https://hopeforjustice.org/manage-your-preferences"
							target="_blank"
							rel="noopener noreferrer"
							className="underline text-sm"
						>
							hopeforjustice.org/manage-your-preferences
						</a>
					</p>,
					<p>
						We will always store your personal information securely. We will use
						it to provide the service(s) you have requested, and communicate
						with you in the way(s) you have agreed to. We will only allow your
						information to be used by third parties working on our behalf. We
						will share your information if required to do so by law. For details
						see our{" "}
						<a
							href="https://hopeforjustice.org/privacy-policy"
							target="_blank"
							rel="noopener noreferrer"
							className="underline text-sm"
						>
							Privacy Policy
						</a>
						.
					</p>,
				],
				fields: [
					{
						id: "emailPreference",
						label: "Email",
						type: "select",
						// onChange: changeColor,
						options: [
							{ text: "Yes", value: true },
							{ text: "No", value: false },
						],
					},
					{
						id: "postPreference",
						label: "Post",
						type: "select",
						// onChange: changeColor,
						options: [
							{ text: "Yes", value: true },
							{ text: "No", value: false },
						],
					},
					{
						id: "smsPreference",
						label: "SMS",
						type: "select",
						// onChange: changeColor,
						options: [
							{ text: "Yes", value: true },
							{ text: "No", value: false },
						],
					},
					{
						id: "phonePreference",
						label: "Phone",
						type: "select",
						// onChange: changeColor,
						options: [
							{ text: "Yes", value: true },
							{ text: "No", value: false },
						],
					},
				],
			},
			{
				id: "inspirationQuestion",
				label: "What inspired you to give?",
				optional: true,
				type: "select",
				options: [
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
			},
			{
				id: "inspirationDetails",
				label: "Please tell us more",
				type: "textarea",
				optional: true,
			},
			{
				id: "givingSummary",
				type: "givingSummary",
			},
		],
	},
];
