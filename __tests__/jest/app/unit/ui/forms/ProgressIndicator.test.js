import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import ProgressIndicator from "@/app/ui/forms/ProgressIndicator";

describe("ProgressIndicator component", () => {
	const steps = [
		{ id: 1, title: "Step 1" },
		{ id: 2, title: "Step 2" },
		{ id: 3, title: "Step 3" },
	];

	it("renders the progress container with correct aria-label", () => {
		render(<ProgressIndicator steps={steps} currentStep={1} />);
		const container = screen.getByLabelText("Progress");
		expect(container).toBeInTheDocument();
	});

	it("renders the correct number of steps", () => {
		render(<ProgressIndicator steps={steps} currentStep={1} />);
		const listItems = screen.getAllByRole("listitem");
		expect(listItems).toHaveLength(steps.length);
	});

	it("displays completed steps with the correct style and sr-only label", () => {
		render(<ProgressIndicator steps={steps} currentStep={1} />);
		const completeStepDiv = screen
			.getAllByRole("listitem")[0]
			.querySelector(".bg-hfj-green");
		expect(completeStepDiv).toBeInTheDocument();
		expect(screen.getByText("Step 1")).toHaveClass("sr-only");
	});

	it("displays the current step with aria-current and correct styles", () => {
		render(<ProgressIndicator steps={steps} currentStep={1} />);
		const currentStepElement = screen
			.getAllByRole("listitem")[1]
			.querySelector('[aria-current="step"]');
		expect(currentStepElement).toHaveAttribute("aria-current", "step");
		const currentStepDiv = screen
			.getAllByRole("listitem")[1]
			.querySelector(".bg-hfj-red");
		expect(currentStepDiv).toBeInTheDocument();
	});

	it("displays upcoming steps with the correct style", () => {
		render(<ProgressIndicator steps={steps} currentStep={1} />);
		const upcomingStepDiv = screen
			.getAllByRole("listitem")[2]
			.querySelector(".bg-gray-200");
		expect(upcomingStepDiv).toBeInTheDocument();
	});
});
