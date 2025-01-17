import React from "react";
import { render, prettyDOM, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import RootLayout from "@/app/layout";

jest.mock("next/font/local", () => {
	return jest.fn(() => ({
		src: "",
		variable: "--mock--css-var",
	}));
});

// Suppress warning about nesting html in a div, this is due to the way the render function works
const originalConsoleError = console.error;

beforeEach(() => {
	console.error = (...args) => {
		if (typeof args[0] === "string" && args[0].includes("validateDOMNesting")) {
			return;
		}
		originalConsoleError(...args);
	};
});

afterEach(() => {
	console.error = originalConsoleError;
});

describe("RootLayout Component", () => {
	it("applies the correct class names to the body element and renders children", () => {
		render(
			<RootLayout>
				<div data-testid="root-layout-child"></div>
			</RootLayout>
		);

		const bodyElement = screen.getByTestId("root-layout-body");
		const childElement = screen.getByTestId("root-layout-child");

		expect(childElement).toBeInTheDocument();
		expect(bodyElement).toBeInTheDocument();
		expect(bodyElement).toHaveClass("font-sans");
		expect(bodyElement).toHaveClass("antialiased");
		expect(bodyElement).toHaveClass("--mock--css-var");
	});
});
