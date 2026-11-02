// Country dialling codes with the allowed national-number length (digits only)
export const COUNTRIES = [
  { name: "India", code: "+91", flag: "🇮🇳", min: 10, max: 10 },
  { name: "United States / Canada", code: "+1", flag: "🇺🇸", min: 10, max: 10 },
  { name: "United Kingdom", code: "+44", flag: "🇬🇧", min: 10, max: 10 },
  { name: "Australia", code: "+61", flag: "🇦🇺", min: 9, max: 9 },
  { name: "United Arab Emirates", code: "+971", flag: "🇦🇪", min: 9, max: 9 },
  { name: "Saudi Arabia", code: "+966", flag: "🇸🇦", min: 9, max: 9 },
  { name: "Singapore", code: "+65", flag: "🇸🇬", min: 8, max: 8 },
  { name: "Germany", code: "+49", flag: "🇩🇪", min: 10, max: 11 },
  { name: "France", code: "+33", flag: "🇫🇷", min: 9, max: 9 },
  { name: "Japan", code: "+81", flag: "🇯🇵", min: 10, max: 10 },
  { name: "China", code: "+86", flag: "🇨🇳", min: 11, max: 11 },
  { name: "Pakistan", code: "+92", flag: "🇵🇰", min: 10, max: 10 },
  { name: "Bangladesh", code: "+880", flag: "🇧🇩", min: 10, max: 10 },
  { name: "Nepal", code: "+977", flag: "🇳🇵", min: 10, max: 10 },
  { name: "Sri Lanka", code: "+94", flag: "🇱🇰", min: 9, max: 9 },
  { name: "South Africa", code: "+27", flag: "🇿🇦", min: 9, max: 9 },
];

export const getCountry = (code) => COUNTRIES.find((c) => c.code === code) || COUNTRIES[0];

// "+91 9815012345" -> { dial: "+91", number: "9815012345" }
export function splitPhone(phone = "") {
  const m = phone.match(/^(\+\d{1,4}) (\d+)$/);
  return m ? { dial: m[1], number: m[2] } : { dial: "+91", number: phone.replace(/\D/g, "") };
}

// Returns an error message, or "" when the number is valid (empty is allowed)
export function phoneError(dial, number) {
  if (!number) return "";
  const c = getCountry(dial);
  if (number.length < c.min || number.length > c.max) {
    const len = c.min === c.max ? `${c.min}-digit` : `${c.min} to ${c.max}-digit`;
    return `Enter a ${len} phone number for ${c.name}.`;
  }
  if (c.code === "+91" && !/^[6-9]/.test(number)) return "Indian mobile numbers start with 6, 7, 8 or 9.";
  return "";
}
