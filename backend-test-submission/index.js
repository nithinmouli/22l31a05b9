const express = require('express');
const cors = require('cors');
const { log, setup, logger } = require('../logging-middleware');
const { createShortUrl, getUrl, recordClick, getStats } = require('./urlStore');
const { validateUrl, checkValidity, checkShortcode, getLocationFromIp, getUserIp } = require('./validator');

const app = express();
const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || 'localhost';

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

app.use((req, res, next) => {
    const ip = getUserIp(req);
    logger.info('backend', 'middleware', `${req.method} ${req.path} from ${ip}`);
    next();
});

const authToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiIyMmwzMWEwNWI5QHZpZ25hbmlpdC5lZHUuaW4iLCJleHAiOjE3NTY5NzQ4OTQsImlhdCI6MTc1Njk3Mzk5NCwiaXNzIjoiQWZmb3JkIE1lZGljYWwgVGVjaG5vbG9naWVzIFByaXZhdGUgTGltaXRlZCIsImp0aSI6ImYxOTBhMWIyLWM5NDEtNDZkOS1iYzc1LTA3ZGM0Njc2ODUzNCIsImxvY2FsZSI6ImVuLUlOIiwibmFtZSI6Im5pdGhpbiBtb3VsaSBtYWR1Iiwic3ViIjoiZWMyOGFkNjMtMWNlYy00MTQxLTk3MDctNjY0M2E3YjA5M2NjIn0sImVtYWlsIjoiMjJsMzFhMDViOUB2aWduYW5paXQuZWR1LmluIiwibmFtZSI6Im5pdGhpbiBtb3VsaSBtYWR1Iiwicm9sbE5vIjoiMjJsMzFhMDViOSIsImFjY2Vzc0NvZGUiOiJZenVKZVUiLCJjbGllbnRJRCI6ImVjMjhhZDYzLTFjZWMtNDE0MS05NzA3LTY2NDNhN2IwOTNjYyIsImNsaWVudFNlY3JldCI6ImhGenlQYWpTR01ETlNOQlYifQ.4RYXJfmxVdxyeVj465vQgRrx_gFYcPY1R7t6z3Op63M"
async function initializeApp() {
    try {
        setup(authToken);
        await logger.info('backend', 'service', 'Service starting');
    } catch (error) {
        console.error('Failed to initialize logging:', error.message);
        process.exit(1);
    }
}

app.post('/shorturls', async (req, res) => {
    try {
        await logger.info('backend', 'handler', 'URL shorten request received');
        
        const { url, validity, shortcode } = req.body;

        const urlCheck = validateUrl(url);
        if (!urlCheck.isValid) {
            await logger.warn('backend', 'handler', `Invalid URL: ${urlCheck.error}`);
            return res.status(400).json({
                success: false,
                message: urlCheck.error
            });
        }

        const validityCheck = checkValidity(validity);
        if (!validityCheck.isValid) {
            await logger.warn('backend', 'handler', `Invalid validity: ${validityCheck.error}`);
            return res.status(400).json({
                success: false,
                message: validityCheck.error
            });
        }

        const shortcodeCheck = checkShortcode(shortcode);
        if (!shortcodeCheck.isValid) {
            await logger.warn('backend', 'handler', `Invalid shortcode: ${shortcodeCheck.error}`);
            return res.status(400).json({
                success: false,
                message: shortcodeCheck.error
            });
        }

        try {
            const urlData = createShortUrl(
                url, 
                shortcodeCheck.value, 
                validityCheck.value
            );

            const shortLink = `http://${HOST}:${PORT}/${urlData.shortcode}`;

            await logger.info('backend', 'service', `URL shortened: ${urlData.shortcode}`);

            res.status(201).json({
                success: true,
                shortLink,
                expiry: urlData.expiry,
                message: 'Short URL created successfully'
            });

        } catch (error) {
            if (error.message === 'Shortcode already exists') {
                await logger.warn('backend', 'service', `Shortcode collision: ${shortcode}`);
                return res.status(409).json({
                    success: false,
                    message: 'This shortcode is already taken, please try a different one'
                });
            }
            throw error;
        }

    } catch (error) {
        await logger.error('backend', 'handler', 'URL shortening failed');
        res.status(500).json({
            success: false,
            message: 'Something went wrong while creating your short URL'
        });
    }
});

app.get('/shorturls/:shortcode', async (req, res) => {
    try {
        const { shortcode } = req.params;
        
        await logger.info('backend', 'handler', `Stats for: ${shortcode}`);

        const stats = getStats(shortcode);
        
        if (!stats) {
            await logger.warn('backend', 'handler', `Shortcode not found: ${shortcode}`);
            return res.status(404).json({
                success: false,
                message: 'Short URL not found'
            });
        }

        await logger.info('backend', 'service', `Stats retrieved: ${shortcode}`);
        
        res.json({
            success: true,
            data: {
                shortcode: stats.shortcode,
                originalUrl: stats.originalUrl,
                createdAt: stats.createdAt,
                expiry: stats.expiry,
                totalClicks: stats.totalClicks,
                isActive: stats.isActive,
                clickDetails: stats.clicks.map(click => ({
                    timestamp: click.timestamp,
                    referrer: click.referrer,
                    location: click.location,
                    userAgent: click.userAgent
                }))
            }
        });

    } catch (error) {
        await logger.error('backend', 'handler', 'Stats retrieval failed');
        res.status(500).json({
            success: false,
            message: 'Unable to retrieve statistics at this time'
        });
    }
});

app.get('/:shortcode', async (req, res) => {
    try {
        const { shortcode } = req.params;
        const ip = getUserIp(req);
        
        await logger.info('backend', 'handler', `Redirect: ${shortcode}`);

        const urlData = getUrl(shortcode);
        
        if (!urlData) {
            await logger.warn('backend', 'handler', `Not found: ${shortcode}`);
            return res.status(404).json({
                success: false,
                message: 'This link has expired or does not exist'
            });
        }

        const location = getLocationFromIp(ip);
        const clickData = {
            ip,
            location,
            referrer: req.get('Referer') || 'direct',
            userAgent: req.get('User-Agent') || 'unknown'
        };

        recordClick(shortcode, clickData);
        
        await logger.info('backend', 'service', `Redirected: ${shortcode}`);

        res.redirect(302, urlData.originalUrl);

    } catch (error) {
        await logger.error('backend', 'handler', 'Redirect failed');
        res.status(500).json({
            success: false,
            message: 'Unable to redirect at this time'
        });
    }
});

app.use((req, res) => {
    logger.warn('backend', 'handler', `404: ${req.path}`);
    res.status(404).json({
        success: false,
        message: 'Page not found'
    });
});

app.use((error, req, res, next) => {
    logger.error('backend', 'middleware', 'Unhandled error occurred');
    res.status(500).json({
        success: false,
        message: 'Something unexpected happened'
    });
});

async function startServer() {
    try {
        await initializeApp();
        
        app.listen(PORT, () => {
            logger.info('backend', 'service', `Server running on ${HOST}:${PORT}`);
            console.log(`URL Shortener service running on http://${HOST}:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    startServer();
}

module.exports = app;
