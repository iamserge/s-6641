import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


/**
 * Convert country name to ISO 3166-1 alpha-2 country code
 * This is a simplified version with just a few common countries
 */
export const getCountryCode = (country: string): string => {
  const countryMap: Record<string, string> = {
    "united states": "US",
    "usa": "US",
    "us": "US",
    "united kingdom": "GB",
    "uk": "GB",
    "great britain": "GB",
    "france": "FR",
    "germany": "DE",
    "italy": "IT",
    "spain": "ES",
    "canada": "CA",
    "japan": "JP",
    "china": "CN",
    "south korea": "KR",
    "korea": "KR",
    "australia": "AU",
    "brazil": "BR",
    "india": "IN",
    "russia": "RU",
    "mexico": "MX",
    "switzerland": "CH",
    "sweden": "SE",
    "norway": "NO",
    "denmark": "DK",
    "finland": "FI",
    "netherlands": "NL",
    "belgium": "BE",
    "ireland": "IE",
    "poland": "PL",
    "austria": "AT",
    "greece": "GR",
    "turkey": "TR",
    "israel": "IL",
    "thailand": "TH",
    "singapore": "SG",
    "malaysia": "MY",
    "indonesia": "ID",
    "philippines": "PH",
    "new zealand": "NZ",
    "south africa": "ZA",
    "argentina": "AR",
    "chile": "CL",
    "colombia": "CO",
    "peru": "PE",
    "venezuela": "VE",
    "egypt": "EG",
    "morocco": "MA",
    "saudi arabia": "SA",
    "united arab emirates": "AE",
    "uae": "AE",
    "pakistan": "PK",
    "bangladesh": "BD",
    "vietnam": "VN",
    "taiwan": "TW",
    "hong kong": "HK",
    "portugal": "PT",
    "czech republic": "CZ",
    "czechia": "CZ",
    "hungary": "HU",
    "romania": "RO",
    "bulgaria": "BG",
    "croatia": "HR",
    "serbia": "RS",
    "ukraine": "UA",
    "belarus": "BY",
    "kazakhstan": "KZ",
    "estonia": "EE",
    "latvia": "LV",
    "lithuania": "LT",
    "slovenia": "SI",
    "slovakia": "SK",
  };

  const normalizedCountry = country.trim().toLowerCase();
  return countryMap[normalizedCountry] || '';
};

/**
 * Convert country code to emoji flag
 * Works by converting two-letter country code to regional indicator symbols
 */
export const countryCodeToFlag = (countryCode: string): string => {
  if (!countryCode || countryCode.length !== 2) return '';
  
  // Regional indicator symbols are 127462 (🇦) to 127487 (🇿)
  // country codes are converted to uppercase, then to regional indicator symbols
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  
  return String.fromCodePoint(...codePoints);
};

/**
 * Get country flag emoji from country name
 */
export const getFlagEmoji = (country?: string | null): string => {
  if (!country) return '';
  
  const countryCode = getCountryCode(country);
  if (!countryCode) return '';
  
  return countryCodeToFlag(countryCode);
};