
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getFlagEmoji(countryCode: string): string {
  // For country names rather than country codes
  const countryNameToCode: Record<string, string> = {
    'usa': 'US',
    'united states': 'US',
    'uk': 'GB',
    'united kingdom': 'GB',
    'france': 'FR',
    'germany': 'DE',
    'italy': 'IT',
    'spain': 'ES',
    'canada': 'CA',
    'australia': 'AU',
    'japan': 'JP',
    'china': 'CN',
    'india': 'IN',
    'south korea': 'KR',
    'korea': 'KR',
    'brazil': 'BR',
    'russia': 'RU',
    'mexico': 'MX',
    'switzerland': 'CH',
    'sweden': 'SE',
    'denmark': 'DK',
    'norway': 'NO',
    'finland': 'FI',
    'netherlands': 'NL',
    'belgium': 'BE',
    'austria': 'AT',
    'portugal': 'PT',
    'greece': 'GR',
    'ireland': 'IE',
    'new zealand': 'NZ',
    'singapore': 'SG',
    'israel': 'IL',
    'poland': 'PL',
    'czech republic': 'CZ',
    'czechia': 'CZ',
    'hungary': 'HU',
    'turkey': 'TR',
    'south africa': 'ZA'
  };
  
  // Normalize input
  const normalizedInput = countryCode.toLowerCase().trim();
  
  // Get the country code
  let code = countryNameToCode[normalizedInput] || countryCode;
  
  // If the code is already 2 characters, use it directly
  if (code.length === 2) {
    // Convert to region indicator symbols
    const codePoints = [...code.toUpperCase()].map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  }
  
  // If no matching flag found, return a generic emoji
  return '🌎';
}
