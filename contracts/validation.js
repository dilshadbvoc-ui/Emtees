import { z } from "zod";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { COUNTRIES } from "./countries";
export function getCountryISOFromDialCode(dialCode) {
    const cleanCode = dialCode.trim();
    const found = COUNTRIES.find((c) => c.code === cleanCode);
    return found ? found.iso : null;
}
export function parseFullPhone(fullPhone, defaultCountry = "IN") {
    if (!fullPhone)
        return null;
    const cleanPhone = fullPhone.trim();
    try {
        const formattedVal = cleanPhone.startsWith("+") ? cleanPhone : `+${cleanPhone.replace(/^\+/, "")}`;
        let parsed = parsePhoneNumberFromString(formattedVal);
        if (!parsed || !parsed.isValid()) {
            parsed = parsePhoneNumberFromString(cleanPhone, defaultCountry);
        }
        if (parsed && parsed.isValid()) {
            return {
                countryCode: `+${parsed.countryCallingCode}`,
                phoneNumber: parsed.nationalNumber,
                countryISO: parsed.country || "IN",
            };
        }
    }
    catch (e) {
        // Ignore
    }
    return null;
}
export function isValidPhone(phone, defaultCountry = "IN") {
    if (!phone)
        return false;
    try {
        const formattedVal = phone.startsWith("+") ? phone : `+${phone.replace(/^\+/, "")}`;
        let parsed = parsePhoneNumberFromString(formattedVal);
        if (!parsed || !parsed.isValid()) {
            parsed = parsePhoneNumberFromString(phone, defaultCountry);
        }
        return !!(parsed && parsed.isValid());
    }
    catch (e) {
        return false;
    }
}
export function validatePhoneNumber(countryCode, phoneNumber, countryISO) {
    if (!countryCode) {
        return "Country code is required.";
    }
    if (!phoneNumber) {
        return "Phone number is required.";
    }
    if (!/^\d+$/.test(phoneNumber)) {
        return "Phone number must contain digits only.";
    }
    const iso = countryISO || getCountryISOFromDialCode(countryCode);
    if (!iso) {
        return "Invalid country code selected.";
    }
    try {
        const parsed = parsePhoneNumberFromString(phoneNumber, iso);
        if (!parsed || !parsed.isValid()) {
            return `Invalid phone number for the selected country.`;
        }
    }
    catch (e) {
        return "Invalid phone number format.";
    }
    return null;
}
export const PHONE_ERROR_MESSAGE = "Please enter a valid mobile number.";
export const phoneSchema = z.string().refine((val) => isValidPhone(val), {
    message: PHONE_ERROR_MESSAGE,
});
