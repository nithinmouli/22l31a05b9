const validator = require('validator');
const geoip = require('geoip-lite');

function validateUrl(url) {
    if (!url || typeof url !== 'string') {
        return { isValid: false, error: 'URL is required and must be a string' };
    }

    if (!validator.isURL(url, { require_protocol: true })) {
        return { isValid: false, error: 'Invalid URL format' };
    }

    if (url.length > 2048) {
        return { isValid: false, error: 'URL too long (max 2048 characters)' };
    }

    return { isValid: true };
}

function checkValidity(minutes) {
    if (minutes === undefined || minutes === null) {
        return { isValid: true, value: 30 };
    }

    if (!Number.isInteger(minutes) || minutes <= 0) {
        return { isValid: false, error: 'Validity must be a positive integer' };
    }

    if (minutes > 525600) {
        return { isValid: false, error: 'Validity cannot exceed 1 year (525600 minutes)' };
    }

    return { isValid: true, value: minutes };
}

function checkShortcode(code) {
    if (!code) {
        return { isValid: true, value: null };
    }

    if (typeof code !== 'string') {
        return { isValid: false, error: 'Shortcode must be a string' };
    }

    if (code.length < 3 || code.length > 10) {
        return { isValid: false, error: 'Shortcode must be 3-10 characters long' };
    }

    if (!/^[a-zA-Z0-9]+$/.test(code)) {
        return { isValid: false, error: 'Shortcode must contain only alphanumeric characters' };
    }

    return { isValid: true, value: code };
}

function getLocationFromIp(clientIp) {
    try {
        if (!clientIp || clientIp === 'unknown' || clientIp === '127.0.0.1' || clientIp === '::1') {
            return 'local';
        }

        const location = geoip.lookup(clientIp);
        if (location) {
            return `${location.city || 'Unknown'}, ${location.country || 'Unknown'}`;
        }

        return 'unknown';
    } catch (err) {
        return 'unknown';
    }
}

function getUserIp(req) {
    return req.headers['x-forwarded-for'] || 
           req.headers['x-real-ip'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           '127.0.0.1';
}

module.exports = {
    validateUrl,
    checkValidity,
    checkShortcode,
    getLocationFromIp,
    getUserIp
};