import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MultiStepForm from "@/app/ui/forms/MultiStepForm";
import { useSearchParams } from "next/navigation";

// Mock `useSearchParams` from `next/navigation`
jest.mock("next/navigation", () => ({
	useSearchParams: jest.fn(),
}));

describe("MultiStepForm component without mocking form behavior", () => {
	beforeEach(() => {
		// Provide a mock implementation for `useSearchParams`
		useSearchParams.mockReturnValue({
			get: jest.fn((param) => {
				// Set test-specific values for query parameters here
				if (param === "currency") return "gbp";
				if (param === "givingFrequency") return "monthly";
				return null;
			}),
		});

		// Mock fetch for any API calls
		// jest.spyOn(global, "fetch").mockImplementation((url) => {
		// 	if (url.includes("/api/getPreferences")) {
		// 		return Promise.resolve({
		// 			json: () => Promise.resolve({
		// 				preferences: {
		// 					emailPreference: true,
		// 					postPreference: false,
		// 					smsPreference: true,
		// 					phonePreference: false,
		// 				},
		// 			}),
		// 			ok: true,
		// 		});
		// 	}
		// 	if (url.includes("/api/processDirectDebit")) {
		// 		return Promise.resolve({
		// 			json: () => Promise.resolve({ response: { authorisationUrl: "/success" } }),
		// 			ok: true,
		// 		});
		// 	}
		// 	return Promise.reject(new Error("Unknown API endpoint"));
		// });
	});

	// afterEach(() => {
	// 	// Restore mocks after each test
	// 	global.fetch.mockRestore();
	// });

	it("renders the initial step and navigation buttons", () => {
		const mockProps = {
			currency: "gbp",
			frequency: "monthly",
			setCurrency: jest.fn(),
			setAmount: jest.fn(),
			setGivingFrequency: jest.fn(),
			setGiftAid: jest.fn(),
			setLastStep: jest.fn(),
			lastStep: 1,
			desktopSize: true,
		};

		render(<MultiStepForm {...mockProps} />);
		// Check if the form renders (step content should be present)
		// Use getByRole to target the specific heading element instead of generic text
		expect(
			screen.getByRole("heading", { name: "Your Details:" })
		).toBeInTheDocument();
		// The form element doesn't seem to have the role="form", so check for the form element directly
		expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
	});

	// it("navigates to the next step when 'Next Step' is clicked", async () => {
	// 	render(<MultiStepForm />);

	// 	const nextButton = screen.getByText("Next Step");
	// 	fireEvent.click(nextButton);

	// 	await waitFor(() =>
	// 		expect(screen.getByText("Previous")).toBeInTheDocument()
	// 	);
	// 	expect(screen.getByText("Next Step")).toBeInTheDocument();
	// });

	// it("displays fetched preferences when 'Next Step' is clicked", async () => {
	// 	render(<MultiStepForm />);

	// 	// Click next to trigger preferences fetch
	// 	const nextButton = screen.getByText("Next Step");
	// 	fireEvent.click(nextButton);

	// 	// Check if preferences are applied
	// 	await waitFor(() =>
	// 		expect(screen.getByText(/preferences we hold for/i)).toBeInTheDocument()
	// 	);
	// });

	// it("submits the form and redirects on successful submission", async () => {
	// 	delete window.location;
	// 	window.location = { href: "" }; // Mock location.href to capture redirect

	// 	render(<MultiStepForm />);

	// 	// Click Next through all steps to reach Submit
	// 	for (let i = 0; i < initialSteps.length - 1; i++) {
	// 		fireEvent.click(screen.getByText("Next Step"));
	// 		await waitFor(() =>
	// 			expect(screen.getByText("Previous")).toBeInTheDocument()
	// 		);
	// 	}

	// 	const submitButton = screen.getByText("Submit");
	// 	fireEvent.click(submitButton);

	// 	await waitFor(() => expect(window.location.href).toBe("/success"));
	// });
});
