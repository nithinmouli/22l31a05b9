import axios from 'axios';
import logger from './loggingService.js';

const API_BASE_URL = 'http://localhost:8000';

class ApiService {
    constructor() {
        this.client = axios.create({
            baseURL: API_BASE_URL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        this.client.interceptors.request.use(
            (config) => {
                logger.info('api', `Making ${config.method?.toUpperCase()} request to ${config.url}`);
                return config;
            },
            (error) => {
                logger.error('api', `Request failed: ${error.message}`);
                return Promise.reject(error);
            }
        );

        this.client.interceptors.response.use(
            (response) => {
                logger.info('api', `Response received: ${response.status} ${response.statusText}`);
                return response;
            },
            (error) => {
                const message = error.response 
                    ? `${error.response.status}: ${error.response.data?.message || error.message}`
                    : error.message;
                logger.error('api', `API error: ${message}`);
                return Promise.reject(error);
            }
        );
    }

    async createShortUrl(urlData) {
        try {
            logger.info('api', `Creating short URL for: ${urlData.url}`);
            const response = await this.client.post('/shorturls', urlData);
            logger.info('api', 'Short URL created successfully');
            return response.data;
        } catch (error) {
            logger.error('api', `Failed to create short URL: ${error.message}`);
            throw error;
        }
    }

    async getUrlStats(shortcode) {
        try {
            logger.info('api', `Fetching stats for shortcode: ${shortcode}`);
            const response = await this.client.get(`/shorturls/${shortcode}`);
            logger.info('api', 'Stats retrieved successfully');
            return response.data;
        } catch (error) {
            logger.error('api', `Failed to get stats for ${shortcode}: ${error.message}`);
            throw error;
        }
    }

    async checkBackendHealth() {
        try {
            logger.info('api', 'Checking backend health');
            await this.client.get('/shorturls/health-check');
            return true;
        } catch (error) {
            if (error.response && error.response.status === 404) {
                logger.info('api', 'Backend is accessible');
                return true;
            }
            logger.warn('api', `Backend health check failed: ${error.message}`);
            return false;
        }
    }
}

const apiService = new ApiService();
export default apiService;
