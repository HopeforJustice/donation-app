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
		render(<MultiStepForm />);
		expect(screen.getByText("Next Step")).toBeInTheDocument();
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
