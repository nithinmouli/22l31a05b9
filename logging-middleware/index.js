const axios = require('axios');
const LOG_API_URL = 'http://20.244.56.144/evaluation-service/logs';
const VALID_STACKS = ['backend', 'frontend'];
const VALID_LEVELS = ['debug', 'info', 'warn', 'error', 'fatal'];
const BACKEND_PACKAGES = ['cache', 'controller', 'cron_job', 'db', 'domain', 'handler', 'repository', 'route', 'service'];
const FRONTEND_PACKAGES = ['api', 'component', 'hook', 'page', 'state', 'style'];
const SHARED_PACKAGES = ['auth', 'config', 'middleware', 'utils'];
let authToken = null;
function setup(token) {
    if (!token) {
        throw new Error('Token required to setup logging');
    }
    authToken = token;
}
function validateInput(stack, level, packageName, message) {
    if (!VALID_STACKS.includes(stack.toLowerCase())) {
        throw new Error(`Invalid stack: ${stack}. Use: ${VALID_STACKS.join(', ')}`);
    }

    if (!VALID_LEVELS.includes(level.toLowerCase())) {
        throw new Error(`Invalid level: ${level}. Use: ${VALID_LEVELS.join(', ')}`);
    }
    const pkg = packageName.toLowerCase();
    const stk = stack.toLowerCase();
    if (stk === 'backend') {
        if (!BACKEND_PACKAGES.includes(pkg) && !SHARED_PACKAGES.includes(pkg)) {
            throw new Error(`Invalid backend package: ${packageName}. Use: ${[...BACKEND_PACKAGES, ...SHARED_PACKAGES].join(', ')}`);
        }
    } else if (stk === 'frontend') {
        if (!FRONTEND_PACKAGES.includes(pkg) && !SHARED_PACKAGES.includes(pkg)) {
            throw new Error(`Invalid frontend package: ${packageName}. Use: ${[...FRONTEND_PACKAGES, ...SHARED_PACKAGES].join(', ')}`);
        }
    }
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
        throw new Error('Message is required and must be non-empty');
    }
}
async function log(stack, level, packageName, message) {
    try {
        if (!authToken) {
            throw new Error('Please setup logging first with your token');
        }
        validateInput(stack, level, packageName, message);
        const logData = {
            stack: stack.toLowerCase(),
            level: level.toLowerCase(),
            package: packageName.toLowerCase(),
            message: message.trim()
        };
        const response = await axios.post(LOG_API_URL, logData, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
        console.log(`Log sent: ${level.toUpperCase()} | ${stack}/${packageName} | ${message}`);
        return response.data;
    } catch (error) {
        if (error.response) {
            const apiError = new Error(`API Error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
            apiError.status = error.response.status;
            apiError.data = error.response.data;
            console.error(`Log failed: ${apiError.message}`);
            throw apiError;
        } else if (error.request) {
            const networkError = new Error('Network error: Cannot reach logging API');
            console.error(`${networkError.message}`);
            throw networkError;
        } else {
            console.error(`${error.message}`);
            throw error;
        }
    }
}
const logger = {
    debug: (stack, pkg, msg) => log(stack, 'debug', pkg, msg),
    info: (stack, pkg, msg) => log(stack, 'info', pkg, msg),
    warn: (stack, pkg, msg) => log(stack, 'warn', pkg, msg),
    error: (stack, pkg, msg) => log(stack, 'error', pkg, msg),
    fatal: (stack, pkg, msg) => log(stack, 'fatal', pkg, msg)
};
function isReady() {
    return authToken !== null;
}
function reset() {
    authToken = null;
}
module.exports = {
    log,
    setup,
    logger,
    isReady,
    reset,
    VALID_STACKS,
    VALID_LEVELS,
    BACKEND_PACKAGES,
    FRONTEND_PACKAGES,
    SHARED_PACKAGES
};
