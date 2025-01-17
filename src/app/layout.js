import "./globals.css";
import localFont from "next/font/local";
import clsx from "clsx";

const canela = localFont({
	src: "../fonts/Canela-Medium.woff2",
	variable: "--font-canela",
});

const fk = localFont({
	src: "../fonts/FKScreamerLegacy-Upright.woff2",
	variable: "--font-fk",
});

const apercu = localFont({
	src: [
		{
			path: "../fonts/apercu-regular-pro.woff2",
			weight: "400",
			style: "normal",
		},
		{
			path: "../fonts/apercu-italic-pro.woff2",
			weight: "400",
			style: "italic",
		},
		{
			path: "../fonts/apercu-bold-pro.woff2",
			weight: "700",
			style: "normal",
		},
	],
	variable: "--font-apercu",
});

export const metadata = {
	title: "Hope for Justice | Donate",
	description: "Donate to Hope for Justice",
};

export default function RootLayout({ children }) {
	return (
		<html lang="en">
			<body
				data-testid="root-layout-body"
				className={clsx(
					"font-sans antialiased",
					apercu.variable,
					canela.variable,
					fk.variable
				)}
			>
				{children}
			</body>
		</html>
	);
}
