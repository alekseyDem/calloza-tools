/**
 * Phone Keypad Word Converter
 *
 * Pure functions for converting between words and phone keypad numbers.
 * Standard ITU E.161 / ISO 9995-8 mapping.
 *
 * @license MIT
 * @see https://github.com/calloza/phone-word-converter
 */

/**
 * Letter-to-digit mapping (ITU E.161 standard).
 * @type {Record<string, string>}
 */
const LETTER_TO_DIGIT = {
  A: '2', B: '2', C: '2',
  D: '3', E: '3', F: '3',
  G: '4', H: '4', I: '4',
  J: '5', K: '5', L: '5',
  M: '6', N: '6', O: '6',
  P: '7', Q: '7', R: '7', S: '7',
  T: '8', U: '8', V: '8',
  W: '9', X: '9', Y: '9', Z: '9',
};

/**
 * Digit-to-letters mapping (inverse of LETTER_TO_DIGIT).
 * @type {Record<string, string[]>}
 */
const DIGIT_TO_LETTERS = {
  '2': ['A', 'B', 'C'],
  '3': ['D', 'E', 'F'],
  '4': ['G', 'H', 'I'],
  '5': ['J', 'K', 'L'],
  '6': ['M', 'N', 'O'],
  '7': ['P', 'Q', 'R', 'S'],
  '8': ['T', 'U', 'V'],
  '9': ['W', 'X', 'Y', 'Z'],
};

/**
 * Convert a word or phrase to its phone keypad number.
 *
 * Letters are mapped to digits per ITU E.161.
 * Non-letter characters (spaces, hyphens, etc.) are preserved as-is.
 *
 * @param {string} input - Word or phrase to convert
 * @returns {string} Phone number string
 *
 * @example
 * wordToNumber('FLOWERS')  // '3569377'
 * wordToNumber('CALL ME')  // '2255 63'
 * wordToNumber('1-800-FLOWERS') // '1-800-3569377'
 */
function wordToNumber(input) {
  if (!input) return '';

  return Array.from(input.toUpperCase())
    .map(char => LETTER_TO_DIGIT[char] ?? char)
    .join('');
}

/**
 * Format a digit string with dashes for readability.
 *
 * Groups digits into chunks: 3-4 for 7 digits, 3-3-4 for 10 digits,
 * or groups of 3 for other lengths.
 *
 * @param {string} digits - Raw digit string
 * @returns {string} Formatted string with dashes
 *
 * @example
 * formatNumber('3569377')    // '356-9377'
 * formatNumber('2255633425') // '225-563-3425'
 */
function formatNumber(digits) {
  const clean = digits.replace(/\D/g, '');

  if (clean.length <= 3) return clean;
  if (clean.length <= 4) return clean;
  if (clean.length <= 7) return clean.slice(0, 3) + '-' + clean.slice(3);
  if (clean.length <= 10) {
    return clean.slice(0, 3) + '-' + clean.slice(3, 6) + '-' + clean.slice(6);
  }
  // Longer numbers: groups of 3, last group gets the remainder
  const parts = [];
  for (let i = 0; i < clean.length; i += 3) {
    parts.push(clean.slice(i, i + 3));
  }
  return parts.join('-');
}

/**
 * Find dictionary words that match a digit sequence exactly.
 *
 * @param {string} digits - Digit string (characters 2-9 only)
 * @param {string[]} dictionary - Array of uppercase words to search
 * @returns {string[]} Matching words, sorted alphabetically
 *
 * @example
 * numberToWords('228', ['ACT', 'BAT', 'CAT', 'DOG'])
 * // ['ACT', 'BAT', 'CAT']
 */
function numberToWords(digits, dictionary) {
  const clean = digits.replace(/[^2-9]/g, '');

  if (!clean) return [];

  return dictionary
    .filter(word => {
      if (word.length !== clean.length) return false;
      return wordToNumber(word) === clean;
    })
    .sort();
}

/**
 * Build a lookup map from digit sequences to dictionary words.
 * Pre-computes the keypad encoding of every word for fast matching.
 *
 * @param {string[]} dictionary - Array of uppercase words
 * @returns {Map<string, string[]>} Map of digit sequence → matching words
 */
function buildWordIndex(dictionary) {
  const index = new Map();

  for (const word of dictionary) {
    const digits = wordToNumber(word);
    if (!index.has(digits)) {
      index.set(digits, []);
    }
    index.get(digits).push(word);
  }

  return index;
}

/**
 * Find dictionary words within any substring of a digit sequence.
 *
 * Scans all contiguous substrings (length 3–7) of the input digits.
 * Returns results formatted as prefix-WORD-suffix.
 *
 * @param {string} digits - Full digit string (0-9)
 * @param {Map<string, string[]>} wordIndex - Pre-built index from buildWordIndex()
 * @param {number} [minLen=3] - Minimum word length to match
 * @param {number} [maxLen=7] - Maximum word length to match
 * @returns {Array<{word: string, start: number, end: number, display: string}>}
 *   Matches sorted by word length (longest first), then alphabetically.
 *
 * @example
 * // With index containing BOOK (2665), COOL (2665):
 * findPartialWords('12665', index)
 * // [
 * //   { word: 'BOOK', start: 1, end: 5, display: '1-BOOK' },
 * //   { word: 'COOL', start: 1, end: 5, display: '1-COOL' },
 * // ]
 */
function findPartialWords(digits, wordIndex, minLen, maxLen) {
  minLen = minLen || 3;
  maxLen = maxLen || 7;

  var results = [];
  var len = digits.length;

  for (var size = Math.min(maxLen, len); size >= minLen; size--) {
    for (var start = 0; start <= len - size; start++) {
      var sub = digits.slice(start, start + size);

      // Skip substrings that contain 0 or 1 (no letters on those keys)
      if (/[01]/.test(sub)) continue;

      var words = wordIndex.get(sub);
      if (!words) continue;

      var prefix = digits.slice(0, start);
      var suffix = digits.slice(start + size);

      for (var i = 0; i < words.length; i++) {
        var parts = [];
        if (prefix) parts.push(prefix);
        parts.push(words[i]);
        if (suffix) parts.push(suffix);

        results.push({
          word: words[i],
          start: start,
          end: start + size,
          display: parts.join('-'),
        });
      }
    }
  }

  // Sort: longest words first, then alphabetically
  results.sort(function (a, b) {
    var lenDiff = b.word.length - a.word.length;
    if (lenDiff !== 0) return lenDiff;
    return a.display.localeCompare(b.display);
  });

  return results;
}

/**
 * Get the letters associated with a keypad digit.
 *
 * @param {string} digit - Single digit character ('2'-'9')
 * @returns {string[]} Array of letters, or empty array for invalid input
 *
 * @example
 * getLettersForDigit('2') // ['A', 'B', 'C']
 * getLettersForDigit('7') // ['P', 'Q', 'R', 'S']
 */
function getLettersForDigit(digit) {
  return DIGIT_TO_LETTERS[digit] ?? [];
}

/**
 * Get the digit associated with a letter.
 *
 * @param {string} letter - Single letter character (A-Z, case-insensitive)
 * @returns {string|null} Digit character, or null for non-letter input
 *
 * @example
 * getDigitForLetter('A') // '2'
 * getDigitForLetter('z') // '9'
 */
function getDigitForLetter(letter) {
  return LETTER_TO_DIGIT[letter.toUpperCase()] ?? null;
}
