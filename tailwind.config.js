/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			colors: {
				"hfj-red": {
					DEFAULT: "#d6001c",
					tint1: "#de3d52",
					tint2: "#e57a88",
					tint3: "#edb7be",
				},
				"hfj-green": {
					DEFAULT: "#5CAA7F",
				},
				"hfj-yellow": {
					DEFAULT: "#F79429",
					tint1: "#F3C05D",
					tint2: "#F0D193",
					tint3: "#FFF5E0",
				},
				"hfj-black": {
					DEFAULT: "#1c2122",
					tint1: "#646768",
					tint2: "#acaeae",
					tint3: "#FAFAFA",
				},
			},
			fontFamily: {
				sans: "var(--font-apercu)",
				display: "var(--font-canela)",
				fk: "var(--font-fk)",
			},
		},
	},
	plugins: [require("@tailwindcss/forms")],
};
