import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import FacebookIcon from "@/app/ui/icons/FacebookIcon";
import XIcon from "@/app/ui/icons/XIcon";
import LinkedInIcon from "@/app/ui/icons/LinkedInIcon";
import InstagramIcon from "@/app/ui/icons/InstagramIcon";
import TickIcon from "@/app/ui/icons/TickIcon";

describe("FacebookIcon component", () => {
	it("renders anchor SVG Icon with correct href and target", () => {
		const { container } = render(<FacebookIcon />);
		const svg = container.querySelector("svg");

		expect(svg).toBeInTheDocument();
		expect(container.firstChild).toHaveAttribute(
			"href",
			"https://www.facebook.com/hopeforjustice/"
		);
		expect(container.firstChild).toHaveAttribute("target", "_blank");
	});
});

describe("LinkedInIcon component", () => {
	it("renders anchor SVG Icon with correct href and target", () => {
		const { container } = render(<LinkedInIcon />);
		const svg = container.querySelector("svg");

		expect(svg).toBeInTheDocument();
		expect(container.firstChild).toHaveAttribute(
			"href",
			"https://www.linkedin.com/company/hope-for-justice"
		);
		expect(container.firstChild).toHaveAttribute("target", "_blank");
	});
});

describe("XIcon component", () => {
	it("renders anchor SVG Icon with correct href and target", () => {
		const { container } = render(<XIcon />);
		const svg = container.querySelector("svg");

		expect(svg).toBeInTheDocument();
		expect(container.firstChild).toHaveAttribute(
			"href",
			"https://twitter.com/Hopeforjustice"
		);
		expect(container.firstChild).toHaveAttribute("target", "_blank");
	});
});

describe("InstagramIcon component", () => {
	it("renders anchor SVG Icon with correct href and target", () => {
		const { container } = render(<InstagramIcon />);
		const svg = container.querySelector("svg");

		expect(svg).toBeInTheDocument();
		expect(container.firstChild).toHaveAttribute(
			"href",
			"https://www.instagram.com/hopeforjusticeintl/"
		);
		expect(container.firstChild).toHaveAttribute("target", "_blank");
	});
});

describe("TickIcon component", () => {
	it("renders TickIcon", () => {
		const { container } = render(<TickIcon />);
		const svg = container.querySelector("svg");

		expect(svg).toBeInTheDocument();
	});
});
