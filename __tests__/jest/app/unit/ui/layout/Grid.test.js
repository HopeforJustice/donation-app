import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import Grid from "@/app/ui/layout/Grid";

describe("Grid component", () => {
	it("renders with default column count of 12", () => {
		render(<Grid>Grid Content</Grid>);
		const grid = screen.getByText("Grid Content");
		expect(grid).toHaveClass("grid-cols-12");
	});

	it("applies the correct column count based on cols prop", () => {
		const { rerender } = render(<Grid cols="6">Grid Content</Grid>);
		const grid = screen.getByText("Grid Content");

		expect(grid).toHaveClass("grid-cols-6");

		// Test with another column count
		rerender(<Grid cols="3">Grid Content</Grid>);
		expect(grid).toHaveClass("grid-cols-3");
		expect(grid).not.toHaveClass("grid-cols-6"); // Ensures previous class is removed
	});

	it("adds additional class names from className prop", () => {
		render(<Grid className="custom-class">Grid Content</Grid>);
		const grid = screen.getByText("Grid Content");
		expect(grid).toHaveClass("custom-class");
		expect(grid).toHaveClass("grid"); // Should always include the `grid` class
	});

	it("renders children inside the grid", () => {
		render(
			<Grid>
				<span>Child 1</span>
				<span>Child 2</span>
			</Grid>
		);

		expect(screen.getByText("Child 1")).toBeInTheDocument();
		expect(screen.getByText("Child 2")).toBeInTheDocument();
	});
});
