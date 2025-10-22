/**
 * Utility functions for handling revision display and formatting
 */

/**
 * Format part number with revision using appropriate separator
 * @param {string} fullPartNumber - The base part number (e.g., "PRT1234")
 * @param {string} revision - The revision string (e.g., "A", "1", "1-0")
 * @param {boolean} useNumberRevisions - Whether to use number-based revisions
 * @param {string} separator - Separator between major and minor ("-" or ".")
 * @returns {string} Formatted part number with revision
 */
export const formatPartNumberWithRevision = (fullPartNumber, revision, useNumberRevisions = false, separator = "-") => {
  // fullPartNumber already contains the properly formatted part number with revision
  return fullPartNumber;
};

/**
 * Parse revision string to extract major and minor numbers
 * @param {string} revision - Revision string (e.g., "1", "1-0", "1-1", "A", "B")
 * @returns {object} Object with major and minor numbers
 */
export const parseRevision = (revision) => {
  if (!revision) {
    return { major: 1, minor: 0 };
  }

  // Handle letter revisions
  if (/^[A-Z]+$/i.test(revision)) {
    const letterNum = convertLetterToNumber(revision);
    return { major: letterNum, minor: 0 };
  }

  // Handle number revisions
  if (revision.includes('-')) {
    const [major, minor] = revision.split('-').map(Number);
    return { major: major || 1, minor: minor || 0 };
  }

  // Single number
  const major = parseInt(revision, 10) || 1;
  return { major, minor: 0 };
};

/**
 * Convert letter revision to number
 * @param {string} letterRevision - Letter revision (e.g., "A", "B", "AA")
 * @returns {number} Numeric equivalent
 */
export const convertLetterToNumber = (letterRevision) => {
  if (!letterRevision) {
    return 1;
  }

  const upper = letterRevision.toUpperCase();
  
  // Handle single letter
  if (upper.length === 1) {
    return upper.charCodeAt(0) - 'A'.charCodeAt(0) + 1;
  }

  // Handle multiple letters (AA, AB, etc.)
  let result = 0;
  for (let i = 0; i < upper.length; i++) {
    const char = upper[upper.length - 1 - i];
    result += (char.charCodeAt(0) - 'A'.charCodeAt(0) + 1) * Math.pow(26, i);
  }

  return result;
};

/**
 * Check if revision string is a letter-based revision
 * @param {string} revision - Revision string to check
 * @returns {boolean} True if letter-based revision
 */
export const isLetterRevision = (revision) => {
  return /^[A-Z]+$/i.test(revision);
};

/**
 * Check if revision string is a number-based revision
 * @param {string} revision - Revision string to check
 * @returns {boolean} True if number-based revision
 */
export const isNumberRevision = (revision) => {
  return /^\d+(-\d+)?$/.test(revision);
};

/**
 * Get revision display format based on organization settings
 * @param {object} organization - Organization object with revision settings
 * @returns {object} Display format settings
 */
export const getRevisionDisplayFormat = (organization) => {
  if (!organization) {
    return { useNumberRevisions: false, format: 'major-minor' };
  }

  return {
    useNumberRevisions: organization.use_number_revisions || false,
    format: organization.revision_format || 'major-minor'
  };
};

/**
 * Create a fuzzy search term for revision matching
 * @param {string} searchTerm - Original search term
 * @returns {string[]} Array of possible search terms for fuzzy matching
 */
export const createFuzzySearchTerms = (searchTerm) => {
  if (!searchTerm) {
    return [];
  }

  const terms = [searchTerm];

  // If searching for letter format, also search for number format
  if (isLetterRevision(searchTerm)) {
    const numberEquivalent = convertLetterToNumber(searchTerm);
    terms.push(numberEquivalent.toString());
    terms.push(`${numberEquivalent}-0`);
  }

  // If searching for number format, also search for letter format
  if (isNumberRevision(searchTerm)) {
    const parsed = parseRevision(searchTerm);
    if (parsed.major <= 26) {
      const letterEquivalent = String.fromCharCode('A'.charCodeAt(0) + parsed.major - 1);
      terms.push(letterEquivalent);
    }
  }

  return terms;
};
