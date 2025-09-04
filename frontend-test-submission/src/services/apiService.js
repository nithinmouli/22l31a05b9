import axios from 'axios';
import loggingService from './loggingService.js';

const API_BASE_URL = 'http://localhost:8000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.setupInterceptors();
  }

  setupInterceptors() {
    axios.interceptors.request.use(
      (config) => {
        loggingService.info('frontend', 'api', `Making ${config.method?.toUpperCase()} request to ${config.url}`);
        return config;
      },
      (error) => {
        loggingService.error('frontend', 'api', `Request failed: ${error.message}`);
        return Promise.reject(error);
      }
    );

    axios.interceptors.response.use(
      (response) => {
        loggingService.info('frontend', 'api', `Received response from ${response.config.url} with status ${response.status}`);
        return response;
      },
      (error) => {
        const status = error.response?.status || 'unknown';
        const url = error.config?.url || 'unknown';
        loggingService.error('frontend', 'api', `API error: ${status} from ${url} - ${error.message}`);
        return Promise.reject(error);
      }
    );
  }

  async createShortUrl(url, validity = null, shortcode = null) {
    try {
      loggingService.info('frontend', 'api', `Creating short URL for: ${url}`);
      
      const payload = { url };
      if (validity !== null && validity !== '') {
        payload.validity = parseInt(validity);
      }
      if (shortcode && shortcode.trim() !== '') {
        payload.shortcode = shortcode.trim();
      }

      const response = await axios.post(`${this.baseURL}/shorturls`, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      loggingService.info('frontend', 'api', `Short URL created successfully: ${response.data.shortLink}`);
      return response.data;
    } catch (error) {
      loggingService.error('frontend', 'api', `Failed to create short URL: ${error.message}`);
      throw this.handleApiError(error);
    }
  }

  async getUrlStats(shortcode) {
    try {
      loggingService.info('frontend', 'api', `Fetching stats for shortcode: ${shortcode}`);
      
      const response = await axios.get(`${this.baseURL}/shorturls/${shortcode}`, {
        timeout: 10000,
      });

      loggingService.info('frontend', 'api', `Stats retrieved for ${shortcode}: ${response.data.data.totalClicks} clicks`);
      return response.data;
    } catch (error) {
      loggingService.error('frontend', 'api', `Failed to fetch stats for ${shortcode}: ${error.message}`);
      throw this.handleApiError(error);
    }
  }

  async getAllUrlStats(shortcodes) {
    try {
      loggingService.info('frontend', 'api', `Fetching stats for ${shortcodes.length} URLs`);
      
      const promises = shortcodes.map(shortcode => 
        this.getUrlStats(shortcode).catch(error => {
          loggingService.warn('frontend', 'api', `Failed to fetch stats for ${shortcode}: ${error.message}`);
          return null;
        })
      );

      const results = await Promise.all(promises);
      const successfulResults = results.filter(result => result !== null);
      
      loggingService.info('frontend', 'api', `Retrieved stats for ${successfulResults.length}/${shortcodes.length} URLs`);
      return successfulResults;
    } catch (error) {
      loggingService.error('frontend', 'api', `Failed to fetch batch URL stats: ${error.message}`);
      throw this.handleApiError(error);
    }
  }

  handleApiError(error) {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || 'An error occurred';
      
      switch (status) {
        case 400:
          return new Error(`Invalid request: ${message}`);
        case 404:
          return new Error(`Not found: ${message}`);
        case 409:
          return new Error(`Conflict: ${message}`);
        case 500:
          return new Error(`Server error: ${message}`);
        default:
          return new Error(`Error ${status}: ${message}`);
      }
    } else if (error.request) {
      return new Error('Network error: Please check your connection and ensure the backend server is running');
    } else {
      return new Error(`Unexpected error: ${error.message}`);
    }
  }

  async checkBackendHealth() {
    try {
      loggingService.info('frontend', 'api', 'Checking backend health');
      await axios.get(`${this.baseURL}/health`, { timeout: 5000 });
      loggingService.info('frontend', 'api', 'Backend is healthy');
      return true;
    } catch (error) {
      loggingService.warn('frontend', 'api', `Backend health check failed: ${error.message}`);
      return false;
    }
  }
}

const apiService = new ApiService();
export default apiService;
