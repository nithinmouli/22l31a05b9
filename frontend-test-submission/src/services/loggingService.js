import axios from 'axios';

const LOG_API_URL = 'http://20.244.56.144/evaluation-service/logs';
const VALID_STACKS = ['backend', 'frontend'];
const VALID_LEVELS = ['debug', 'info', 'warn', 'error', 'fatal'];
const FRONTEND_PACKAGES = ['api', 'component', 'hook', 'page', 'state', 'style'];
const SHARED_PACKAGES = ['auth', 'config', 'middleware', 'utils'];

class LoggingService {
  constructor() {
    this.authToken = null;
    this.isInitialized = false;
  }

  setup(token) {
    if (!token) {
      throw new Error('Token required to setup logging');
    }
    this.authToken = token;
    this.isInitialized = true;
  }

  validateInput(stack, level, packageName, message) {
    if (!VALID_STACKS.includes(stack.toLowerCase())) {
      throw new Error(`Invalid stack: ${stack}. Use: ${VALID_STACKS.join(', ')}`);
    }

    if (!VALID_LEVELS.includes(level.toLowerCase())) {
      throw new Error(`Invalid level: ${level}. Use: ${VALID_LEVELS.join(', ')}`);
    }

    const pkg = packageName.toLowerCase();
    const stk = stack.toLowerCase();
    
    if (stk === 'frontend') {
      if (!FRONTEND_PACKAGES.includes(pkg) && !SHARED_PACKAGES.includes(pkg)) {
        throw new Error(`Invalid frontend package: ${packageName}. Use: ${[...FRONTEND_PACKAGES, ...SHARED_PACKAGES].join(', ')}`);
      }
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw new Error('Message is required and must be non-empty');
    }
  }

  async log(stack, level, packageName, message) {
    try {
      if (!this.authToken) {
        throw new Error('Please setup logging first with your token');
      }

      this.validateInput(stack, level, packageName, message);

      const logData = {
        stack: stack.toLowerCase(),
        level: level.toLowerCase(),
        package: packageName.toLowerCase(),
        message: message.trim()
      };

      const response = await axios.post(LOG_API_URL, logData, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
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

  // Helper methods for different log levels
  debug(stack, pkg, msg) {
    return this.log(stack, 'debug', pkg, msg);
  }

  info(stack, pkg, msg) {
    return this.log(stack, 'info', pkg, msg);
  }

  warn(stack, pkg, msg) {
    return this.log(stack, 'warn', pkg, msg);
  }

  error(stack, pkg, msg) {
    return this.log(stack, 'error', pkg, msg);
  }

  fatal(stack, pkg, msg) {
    return this.log(stack, 'fatal', pkg, msg);
  }

  isReady() {
    return this.authToken !== null && this.isInitialized;
  }

  reset() {
    this.authToken = null;
    this.isInitialized = false;
  }
}

// Create a singleton instance
const loggingService = new LoggingService();

// Initialize with the same token as backend
const authToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiIyMmwzMWEwNWI5QHZpZ25hbmlpdC5lZHUuaW4iLCJleHAiOjE3NTY5Njc1NDksImlhdCI6MTc1Njk2NjY0OSwiaXNzIjoiQWZmb3JkIE1lZGljYWwgVGVjaG5vbG9naWVzIFByaXZhdGUgTGltaXRlZCIsImp0aSI6IjFmOGU2MzMzLTg2ZmUtNDY4OC04YjA5LTZjYjEwY2M3MjZlNSIsImxvY2FsZSI6ImVuLUlOIiwibmFtZSI6Im5pdGhpbiBtb3VsaSBtYWR1Iiwic3ViIjoiZWMyOGFkNjMtMWNlYy00MTQxLTk3MDctNjY0M2E3YjA5M2NjIn0sImVtYWlsIjoiMjJsMzFhMDViOUB2aWduYW5paXQuZWR1LmluIiwibmFtZSI6Im5pdGhpbiBtb3VsaSBtYWR1Iiwicm9sbE5vIjoiMjJsMzFhMDViOSIsImFjY2Vzc0NvZGUiOiJZenVKZVUiLCJjbGllbnRJRCI6ImVjMjhhZDYzLTFjZWMtNDE0MS05NzA3LTY2NDNhN2IwOTNjYyIsImNsaWVudFNlY3JldCI6ImhGenlQYWpTR01ETlNOQlYifQ.37DgD01-JwfDuAgeUM_XCYBlpQ-xNK1rK0LzSMLbD9s";

try {
  loggingService.setup(authToken);
} catch (error) {
  console.error('Failed to initialize logging service:', error);
}

export default loggingService;
