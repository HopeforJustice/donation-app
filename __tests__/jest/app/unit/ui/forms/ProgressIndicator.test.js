import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import ProgressIndicator from "@/app/ui/forms/ProgressIndicator";

describe("ProgressIndicator component", () => {
	const steps = [
		{ id: 1, title: "Step 1", status: "complete" },
		{ id: 2, title: "Step 2", status: "current" },
		{ id: 3, title: "Step 3", status: "upcoming" },
	];

	it("renders the progress container with correct aria-label", () => {
		render(<ProgressIndicator steps={steps} />);
		const container = screen.getByLabelText("Progress");
		expect(container).toBeInTheDocument();
	});

	it("renders the correct number of steps", () => {
		render(<ProgressIndicator steps={steps} />);
		const listItems = screen.getAllByRole("listitem");
		expect(listItems).toHaveLength(steps.length);
	});

	it("displays completed steps with the correct style and sr-only label", () => {
		render(<ProgressIndicator steps={steps} />);
		const completeStep = screen.getByText("Step 1").parentElement;
		expect(completeStep).toHaveClass("bg-hfj-red");
	});

	it("displays the current step with aria-current and correct styles", () => {
		render(<ProgressIndicator steps={steps} />);
		const currentStep = screen.getByText("Step 2").parentElement;
		expect(currentStep).toHaveAttribute("aria-current", "step");
		expect(currentStep.querySelector(".bg-hfj-red")).toBeInTheDocument();
	});

	it("displays upcoming steps with the correct style", () => {
		render(<ProgressIndicator steps={steps} />);
		const upcomingStep = screen.getByText("Step 3").parentElement;
		expect(upcomingStep).toHaveClass("bg-gray-200");
	});
});
