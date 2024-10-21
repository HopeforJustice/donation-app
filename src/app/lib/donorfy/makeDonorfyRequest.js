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

	console.log("donorfy data to send: ", options.body);

	//timing
	const startTime = Date.now();

	const response = await fetch(url, options);

	const endTime = Date.now();
	console.log(`Request to ${url} took ${endTime - startTime} ms`);

	//Check if the response has a body
	let responseData;
	try {
		responseData = await response.json();
	} catch (error) {
		responseData = null; //assume no content
	}

	if (!response.ok) {
		throw new Error(
			`Donorfy request failed: ${responseData?.message || response.statusText}`
		);
	}

	return responseData ? responseData : "ok";
}
