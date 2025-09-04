const { v4: uuidv4 } = require('uuid');

const urls = new Map();
const clicks = new Map();

function createShortUrl(originalUrl, customShortcode = null, validityMinutes = 30) {
    const shortcode = customShortcode || generateShortcode();
    
    if (urls.has(shortcode)) {
        throw new Error('Shortcode already exists');
    }

    const now = new Date();
    const expiry = new Date(now.getTime() + validityMinutes * 60 * 1000);

    const urlData = {
        id: uuidv4(),
        originalUrl,
        shortcode,
        createdAt: now.toISOString(),
        expiry: expiry.toISOString(),
        validityMinutes,
        isActive: true
    };

    urls.set(shortcode, urlData);
    clicks.set(shortcode, []);

    return urlData;
}

function getUrl(shortcode) {
    const urlData = urls.get(shortcode);
    
    if (!urlData) {
        return null;
    }

    if (new Date() > new Date(urlData.expiry)) {
        urlData.isActive = false;
        return null;
    }

    return urlData;
}

function recordClick(shortcode, clickData) {
    if (!clicks.has(shortcode)) {
        clicks.set(shortcode, []);
    }

    const click = {
        timestamp: new Date().toISOString(),
        referrer: clickData.referrer || 'direct',
        userAgent: clickData.userAgent || 'unknown',
        ip: clickData.ip || 'unknown',
        location: clickData.location || 'unknown'
    };

    clicks.get(shortcode).push(click);
    return click;
}

function getStats(shortcode) {
    const urlData = urls.get(shortcode);
    const clickList = clicks.get(shortcode) || [];

    if (!urlData) {
        return null;
    }

    return {
        shortcode,
        originalUrl: urlData.originalUrl,
        createdAt: urlData.createdAt,
        expiry: urlData.expiry,
        totalClicks: clickList.length,
        isActive: urlData.isActive && new Date() <= new Date(urlData.expiry),
        clicks: clickList
    };
}

function generateShortcode() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    
    do {
        result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    } while (urls.has(result));

    return result;
}

function isValidShortcode(shortcode) {
    if (!shortcode || typeof shortcode !== 'string') {
        return false;
    }

    if (shortcode.length < 3 || shortcode.length > 10) {
        return false;
    }

    return /^[a-zA-Z0-9]+$/.test(shortcode);
}

module.exports = {
    createShortUrl,
    getUrl,
    recordClick,
    getStats,
    generateShortcode,
    isValidShortcode
};
