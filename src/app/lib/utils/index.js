/**
 * Centralized utilities index file
 *
 * This file re-exports all utility functions to maintain backward compatibility
 * while organizing code into logical categories. All existing imports will continue to work.
 *
 * Organized into categories:
 * - Form utilities: Input validation, formatting, form processing
 * - Currency utilities: Currency symbols and formatting
 * - Step utilities: Dynamic step configuration and processing
 * - API utilities: Authentication, fetching, data processing
 * - Data utilities: Security, sanitization, metadata handling
 * - Constituent utilities: Donorfy constituent operations and data mapping
 */

// Form utilities - Input validation and formatting
export { onlyNumbers, handlePhoneInput, formatAmount } from "./formUtils";

// Currency utilities - Currency symbols and formatting
export { findCurrencySymbol } from "./currencyUtils";

// Step utilities - Dynamic step configuration
export {
	extractDefaultValues,
	updateStepsWithParams,
	getFieldIdsExcludingRemoved,
} from "./stepUtils";

// API utilities - Data fetching and processing
export {
	fetchWithAuth,
	extractPreferences,
	getPreferences,
	poll,
	getDonorfyClient,
	getSparkPostTemplate,
	sendThankYouEmail,
} from "./apiUtils";

// Data utilities - Security and data processing
export { stripMetadata, sanitiseForLogging } from "./dataUtils";

// Constituent utilities - Donorfy operations
export {
	buildConstituentUpdateData,
	buildConstituentCreateData,
	buildConstituentPreferencesData,
} from "./constituentUtils";
