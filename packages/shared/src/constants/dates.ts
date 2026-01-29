/**
 * Date and Time Constants
 */

export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
  SHORT: 'yyyy-MM-dd',
  TIME: 'HH:mm',
  DATETIME: 'MMM dd, yyyy HH:mm',
} as const;

export const TIMEZONES = {
  DEFAULT: 'Europe/Warsaw',
  UTC: 'UTC',
} as const;
