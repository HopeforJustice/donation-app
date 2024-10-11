export default async function makeDonorfyRequest(
	url,
	method,
	authString,
	data = null
) {
	const headers = {
		Authorization: `Basic ${authString}`,
		"Content-Type": "application/json",
	};

	const options = {
		method,
		headers,
	};

	if (data) {
		options.body = JSON.stringify(data);
	}

	const response = await fetch(url, options);

	// Check if the response has a body
	let responseData;
	try {
		responseData = await response.json();
	} catch (error) {
		responseData = null; // If parsing fails, assume no content
	}

	if (!response.ok) {
		throw new Error(
			`Donorfy request failed: ${responseData?.message || response.statusText}`
		);
	}

	// Return response data if available, otherwise return a default message
	return responseData ? responseData : "ok";
}
