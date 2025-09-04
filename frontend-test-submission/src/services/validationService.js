import loggingService from './loggingService.js';

class ValidationService {
  /**
   * Validate URL format
   * @param {string} url - URL to validate
   * @returns {Object} - { isValid: boolean, error: string }
   */
  validateUrl(url) {
    try {
      loggingService.debug('frontend', 'utils', `Validating URL: ${url}`);
      
      if (!url || typeof url !== 'string' || url.trim().length === 0) {
        return { isValid: false, error: 'URL is required' };
      }

      const trimmedUrl = url.trim();

      // Check minimum length
      if (trimmedUrl.length < 10) {
        return { isValid: false, error: 'URL must be at least 10 characters long' };
      }

      // Check maximum length
      if (trimmedUrl.length > 2048) {
        return { isValid: false, error: 'URL must not exceed 2048 characters' };
      }

      // Check for protocol
      if (!trimmedUrl.match(/^https?:\/\//i)) {
        return { isValid: false, error: 'URL must start with http:// or https://' };
      }

      // Try to create URL object for validation
      try {
        const urlObj = new URL(trimmedUrl);
        
        // Additional checks
        if (!urlObj.hostname) {
          return { isValid: false, error: 'URL must have a valid hostname' };
        }

        // Check for localhost/local IPs (optional - remove if local testing needed)
        const hostname = urlObj.hostname.toLowerCase();
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)) {
          return { isValid: false, error: 'Local URLs are not allowed' };
        }

        loggingService.debug('frontend', 'utils', `URL validation successful: ${url}`);
        return { isValid: true, error: null };
      } catch (urlError) {
        return { isValid: false, error: 'Invalid URL format' };
      }
    } catch (error) {
      loggingService.error('frontend', 'utils', `URL validation error: ${error.message}`);
      return { isValid: false, error: 'Validation error occurred' };
    }
  }

  /**
   * Validate validity period (in minutes)
   * @param {string|number} validity - Validity period to validate
   * @returns {Object} - { isValid: boolean, error: string, value: number }
   */
  validateValidity(validity) {
    try {
      loggingService.debug('frontend', 'utils', `Validating validity: ${validity}`);
      
      // If empty, it's optional - return valid with null value
      if (validity === null || validity === undefined || validity === '') {
        return { isValid: true, error: null, value: null };
      }

      // Convert to number
      const numericValidity = Number(validity);

      // Check if it's a valid number
      if (isNaN(numericValidity) || !Number.isInteger(numericValidity)) {
        return { isValid: false, error: 'Validity must be a whole number', value: null };
      }

      // Check minimum value (1 minute)
      if (numericValidity < 1) {
        return { isValid: false, error: 'Validity must be at least 1 minute', value: null };
      }

      // Check maximum value (1 year = 525600 minutes)
      if (numericValidity > 525600) {
        return { isValid: false, error: 'Validity cannot exceed 1 year (525600 minutes)', value: null };
      }

      loggingService.debug('frontend', 'utils', `Validity validation successful: ${numericValidity} minutes`);
      return { isValid: true, error: null, value: numericValidity };
    } catch (error) {
      loggingService.error('frontend', 'utils', `Validity validation error: ${error.message}`);
      return { isValid: false, error: 'Validation error occurred', value: null };
    }
  }

  /**
   * Validate shortcode
   * @param {string} shortcode - Shortcode to validate
   * @returns {Object} - { isValid: boolean, error: string, value: string }
   */
  validateShortcode(shortcode) {
    try {
      loggingService.debug('frontend', 'utils', `Validating shortcode: ${shortcode}`);
      
      // If empty, it's optional - return valid with null value
      if (!shortcode || shortcode.trim().length === 0) {
        return { isValid: true, error: null, value: null };
      }

      const trimmedShortcode = shortcode.trim();

      // Check length constraints (3-10 characters to match backend)
      if (trimmedShortcode.length < 3) {
        return { isValid: false, error: 'Shortcode must be at least 3 characters long', value: null };
      }

      if (trimmedShortcode.length > 10) {
        return { isValid: false, error: 'Shortcode must not exceed 10 characters', value: null };
      }

      // Check allowed characters (alphanumeric only)
      if (!/^[a-zA-Z0-9]+$/.test(trimmedShortcode)) {
        return { isValid: false, error: 'Shortcode can only contain letters and numbers', value: null };
      }

      // Check if it starts with a letter or number (not special characters)
      if (!/^[a-zA-Z0-9]/.test(trimmedShortcode)) {
        return { isValid: false, error: 'Shortcode must start with a letter or number', value: null };
      }

      loggingService.debug('frontend', 'utils', `Shortcode validation successful: ${trimmedShortcode}`);
      return { isValid: true, error: null, value: trimmedShortcode };
    } catch (error) {
      loggingService.error('frontend', 'utils', `Shortcode validation error: ${error.message}`);
      return { isValid: false, error: 'Validation error occurred', value: null };
    }
  }

  /**
   * Validate all fields for URL shortening
   * @param {Object} data - { url, validity, shortcode }
   * @returns {Object} - { isValid: boolean, errors: Object, values: Object }
   */
  validateUrlShortenData(data) {
    try {
      loggingService.debug('frontend', 'utils', 'Validating URL shorten data');
      
      const { url, validity, shortcode } = data;
      const errors = {};
      const values = {};
      let isValid = true;

      // Validate URL
      const urlValidation = this.validateUrl(url);
      if (!urlValidation.isValid) {
        errors.url = urlValidation.error;
        isValid = false;
      } else {
        values.url = url.trim();
      }

      // Validate validity
      const validityValidation = this.validateValidity(validity);
      if (!validityValidation.isValid) {
        errors.validity = validityValidation.error;
        isValid = false;
      } else {
        values.validity = validityValidation.value;
      }

      // Validate shortcode
      const shortcodeValidation = this.validateShortcode(shortcode);
      if (!shortcodeValidation.isValid) {
        errors.shortcode = shortcodeValidation.error;
        isValid = false;
      } else {
        values.shortcode = shortcodeValidation.value;
      }

      const result = { isValid, errors, values };
      
      if (isValid) {
        loggingService.info('frontend', 'utils', 'All validations passed');
      } else {
        loggingService.warn('frontend', 'utils', `Validation failed: ${Object.keys(errors).join(', ')}`);
      }

      return result;
    } catch (error) {
      loggingService.error('frontend', 'utils', `Batch validation error: ${error.message}`);
      return {
        isValid: false,
        errors: { general: 'Validation error occurred' },
        values: {}
      };
    }
  }

  /**
   * Check if array of URLs is valid (for bulk processing)
   * @param {Array} urls - Array of URL data objects
   * @returns {Object} - { isValid: boolean, results: Array }
   */
  validateBulkUrls(urls) {
    try {
      loggingService.info('frontend', 'utils', `Validating ${urls.length} URLs`);
      
      if (!Array.isArray(urls)) {
        return { isValid: false, results: [], error: 'Invalid input: expected array' };
      }

      if (urls.length === 0) {
        return { isValid: false, results: [], error: 'At least one URL is required' };
      }

      if (urls.length > 5) {
        return { isValid: false, results: [], error: 'Maximum 5 URLs allowed at once' };
      }

      const results = urls.map((urlData, index) => {
        const validation = this.validateUrlShortenData(urlData);
        return {
          index,
          ...validation
        };
      });

      const allValid = results.every(result => result.isValid);
      
      loggingService.info('frontend', 'utils', `Bulk validation complete: ${results.filter(r => r.isValid).length}/${urls.length} valid`);
      
      return {
        isValid: allValid,
        results,
        error: null
      };
    } catch (error) {
      loggingService.error('frontend', 'utils', `Bulk validation error: ${error.message}`);
      return {
        isValid: false,
        results: [],
        error: 'Validation error occurred'
      };
    }
  }
}

// Create and export a singleton instance
const validationService = new ValidationService();
export default validationService;
