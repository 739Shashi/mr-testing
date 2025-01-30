export function formatPhoneNumber(phoneNumber: string, countryCode: string = '+91'): string {
  // Ensure the phone number starts with the country code, remove spaces or dashes
  return phoneNumber.startsWith('+') ? phoneNumber : `${countryCode}${phoneNumber.replace(/\D/g, '')}`;
}
