import en from "./dictionaries/en.json";
import ta from "./dictionaries/ta.json";

export const dictionaries = { en, ta };
export const DEFAULT_LOCALE = "en";
export const SUPPORTED_LOCALES = ["en", "ta"];

/**
 * Retrieves the dictionary for a given locale.
 * @param {string} [locale='en']
 * @returns {typeof en}
 */
export function getDictionary(locale = DEFAULT_LOCALE) {
  return dictionaries[locale] || dictionaries.en;
}

/**
 * Resolves nested dot-notation key (e.g. 'nav.dashboard') from a dictionary.
 * @param {object} dict
 * @param {string} key
 * @param {string} [fallback]
 * @returns {string}
 */
export function resolveKey(dict, key, fallback) {
  if (!dict || !key) return fallback ?? key ?? "";
  const parts = key.split(".");
  let cur = dict;
  for (const part of parts) {
    if (cur && typeof cur === "object" && part in cur) {
      cur = cur[part];
    } else {
      return fallback ?? key;
    }
  }
  return typeof cur === "string" ? cur : (fallback ?? key);
}

/**
 * Direct translator for a given locale.
 * @param {string} locale
 * @param {string} key
 * @param {string} [fallback]
 * @returns {string}
 */
export function translate(locale, key, fallback) {
  const dict = getDictionary(locale);
  return resolveKey(dict, key, fallback);
}

