import React from "react";
import clsx from "clsx";

const Grid = ({ children, cols = "12", rows, className = "" }) => {
	return (
		<div
			className={clsx(`grid ${className}`, {
				"grid-cols-12": cols === "12",
				"grid-cols-11": cols === "11",
				"grid-cols-10": cols === "10",
				"grid-cols-9": cols === "9",
				"grid-cols-8": cols === "8",
				"grid-cols-7": cols === "7",
				"grid-cols-6": cols === "6",
				"grid-cols-5": cols === "5",
				"grid-cols-4": cols === "4",
				"grid-cols-3": cols === "3",
				"grid-cols-2": cols === "2",
				"grid-cols-1": cols === "1",
			})}
		>
			{children}
		</div>
	);
};

export default Grid;
