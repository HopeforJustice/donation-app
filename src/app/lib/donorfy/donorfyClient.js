// DonorfyClient.js

class DonorfyClient {
	constructor(apiKey, tenant) {
		this.apiKey = apiKey;
		this.tenant = tenant;
		this.baseUrl = `https://data.donorfy.com/api/v1/${tenant}`;
		this.authHeader =
			"Basic " + Buffer.from(`DonationApp:${apiKey}`).toString("base64");
	}

	async request(path, method = "GET", body = null) {
		let url = `${this.baseUrl}/${path}`;
		const options = {
			method,
			headers: {
				Authorization: this.authHeader,
				"Content-Type": "application/json",
			},
		};
		// console.log("Donorfy Request:", url);

		if (body) {
			options.body = JSON.stringify(body);
			// console.log("Body:", body);
		}

		const res = await fetch(url, options);
		let data;
		try {
			data = await res.json();
		} catch (e) {
			data = null;
		}
		if (!res.ok) {
			throw new Error(
				`Donorfy API error: ${res.status} ${res.statusText} ${
					data ? JSON.stringify(data) : ""
				}`
			);
		}
		return data;
	}

	// ---- Constituents ----
	async createConstituent(data) {
		return this.request("constituents", "POST", data);
	}
	async getConstituent(id) {
		return this.request(`constituents/${id}`);
	}
	async updateConstituent(id, data) {
		return this.request(`constituents/${id}`, "PUT", data);
	}
	async deleteConstituent(id) {
		return this.request(`constituents/${id}`, "DELETE");
	}
	async duplicateCheck(data) {
		return this.request(`constituents/DuplicateCheckPerson`, "POST", data);
	}
	async getConstituentPreferences(id) {
		return this.request(`constituents/${id}/Preferences`);
	}
	async updateConstituentPreferences(id, data) {
		return this.request(`constituents/${id}/Preferences`, "POST", data);
	}
	async addActiveTags(id, tags) {
		return this.request(`constituents/${id}/AddActiveTags`, "POST", tags);
	}
	async removeTag(id, tags) {
		return this.request(`constituents/${id}/RemoveTag`, "DELETE", tags);
	}
	async getConstituentTags(id) {
		return this.request(`constituents/${id}/ActiveTags`);
	}
	async getConstituentGiftAidDeclarations(id) {
		return this.request(`constituents/${id}/GiftAidDeclarations`);
	}
	async createGiftAidDeclaration(id, data) {
		const date = new Date();
		date.setFullYear(date.getFullYear() + 100);
		const futureDate = date.toISOString();
		const dateNow = new Date().toISOString();
		const modifiedData = {
			...data,
			DeclarationDate: dateNow,
			DeclarationStartDate: dateNow,
			DeclarationEndDate: futureDate,
			DeclarationMethod: "Web",
		};
		return this.request(
			`constituents/${id}/GiftAidDeclarations`,
			"POST",
			modifiedData
		);
	}
	// ---- Activities ----
	async addActivity(data) {
		return this.request(`activities`, "POST", data);
	}
	async getConstituentActivities(id) {
		return this.request(`constituents/${id}/Activities`);
	}

	// ---- Transactions ----
	async createTransaction(
		amount,
		campaign,
		paymentMethod,
		constituentId,
		chargeDate = null,
		fund = "unrestricted",
		utmSource = "",
		utmMedium = "",
		utmCampaign = ""
	) {
		const modifiedData = {
			Product: "Donation",
			Amount: amount,
			Campaign: campaign,
			PaymentMethod: paymentMethod,
			Fund: fund,
			ExistingConstituentId: constituentId,
			DatePaid: chargeDate || new Date().toISOString(),
			UtmSource: utmSource,
			UtmMedium: utmMedium,
			UtmCampaign: utmCampaign,
		};
		return this.request("transactions", "POST", modifiedData);
	}
	async getTransaction(id) {
		return this.request(`transactions/${id}`);
	}
	async deleteTransaction(id) {
		return this.request(`transactions/${id}`, "DELETE");
	}
}

export default DonorfyClient;
