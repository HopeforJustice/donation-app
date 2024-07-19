import React from "react";

const FormContainer = ({ children, className = "" }) => {
	return <div className={` ${className}`}>{children}</div>;
};

export default FormContainer;
