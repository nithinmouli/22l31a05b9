import logger from '../services/loggingService.js';

export const validateUrl = (url) => {
    logger.debug('utils', `Validating URL: ${url}`);
    
    if (!url || typeof url !== 'string' || url.trim().length === 0) {
        return { isValid: false, error: 'URL is required' };
    }

    const trimmedUrl = url.trim();
    if (trimmedUrl.length > 2048) {
        return { isValid: false, error: 'URL must be less than 2048 characters' };
    }
    try {
        const urlObj = new URL(trimmedUrl);
            if (!['http:', 'https:'].includes(urlObj.protocol)) {
            return { isValid: false, error: 'URL must use HTTP or HTTPS protocol' };
        }
        if (!urlObj.hostname || urlObj.hostname.length === 0) {
            return { isValid: false, error: 'URL must have a valid domain' };
        }

        logger.debug('utils', 'URL validation passed');
        return { isValid: true, value: trimmedUrl };
    } catch (error) {
        logger.warn('utils', `URL validation failed: ${error.message}`);
        return { isValid: false, error: 'Please enter a valid URL (e.g., https://example.com)' };
    }
};

export const validateValidity = (validity) => {
    if (!validity || validity === '') {
        logger.debug('utils', 'No validity period provided, using default');
        return { isValid: true, value: null }; 
    }
    const num = parseInt(validity, 10);
    
    if (isNaN(num)) {
        return { isValid: false, error: 'Validity must be a valid number' };
    }

    if (num <= 0) {
        return { isValid: false, error: 'Validity must be greater than 0' };
    }

    if (num > 525600) { 
        return { isValid: false, error: 'Validity cannot exceed 525600 minutes (1 year)' };
    }

    logger.debug('utils', `Validity validation passed: ${num} minutes`);
    return { isValid: true, value: num };
};

export const validateShortcode = (shortcode) => {
    if (!shortcode || shortcode === '') {
        logger.debug('utils', 'No shortcode provided, will be auto-generated');
        return { isValid: true, value: null };
    }

    const trimmed = shortcode.trim();
    
    if (trimmed.length < 4) {
        return { isValid: false, error: 'Shortcode must be at least 4 characters long' };
    }

    if (trimmed.length > 10) {
        return { isValid: false, error: 'Shortcode must be at most 10 characters long' };
    }
    const validPattern = /^[a-zA-Z0-9]+$/;
    if (!validPattern.test(trimmed)) {
        return { isValid: false, error: 'Shortcode can only contain letters and numbers' };
    }

    logger.debug('utils', `Shortcode validation passed: ${trimmed}`);
    return { isValid: true, value: trimmed };
};

export const formatExpiryDate = (expiryString) => {
    try {
        const date = new Date(expiryString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    } catch (error) {
        logger.warn('utils', `Failed to format expiry date: ${error.message}`);
        return 'Invalid date';
    }
};

export const isExpired = (expiryString) => {
    try {
        const expiryDate = new Date(expiryString);
        return new Date() > expiryDate;
    } catch (error) {
        logger.warn('utils', `Failed to check expiry: ${error.message}`);
        return false;
    }
};
