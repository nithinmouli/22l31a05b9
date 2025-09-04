import loggingService from './loggingService.js';

class StorageService {
  constructor() {
    this.STORAGE_KEY = 'url_shortener_data';
    this.initializeStorage();
  }

  initializeStorage() {
    try {
      // Initialize local storage if not exists
      if (!localStorage.getItem(this.STORAGE_KEY)) {
        const initialData = {
          shortenedUrls: [],
          lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(initialData));
        loggingService.info('frontend', 'state', 'Initialized local storage');
      }
    } catch (error) {
      loggingService.error('frontend', 'state', `Failed to initialize storage: ${error.message}`);
    }
  }

  /**
   * Get all stored data
   * @returns {Object} - Stored data object
   */
  getData() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsedData = JSON.parse(data);
        loggingService.debug('frontend', 'state', `Retrieved ${parsedData.shortenedUrls?.length || 0} stored URLs`);
        return parsedData;
      }
      return { shortenedUrls: [], lastUpdated: new Date().toISOString() };
    } catch (error) {
      loggingService.error('frontend', 'state', `Failed to get data: ${error.message}`);
      return { shortenedUrls: [], lastUpdated: new Date().toISOString() };
    }
  }

  /**
   * Save data to local storage
   * @param {Object} data - Data to save
   */
  saveData(data) {
    try {
      const dataToSave = {
        ...data,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToSave));
      loggingService.debug('frontend', 'state', 'Data saved to local storage');
    } catch (error) {
      loggingService.error('frontend', 'state', `Failed to save data: ${error.message}`);
    }
  }

  /**
   * Add a new shortened URL to storage
   * @param {Object} urlData - URL data from API response
   * @param {string} originalUrl - Original URL that was shortened
   */
  addShortenedUrl(urlData, originalUrl) {
    try {
      const data = this.getData();
      
      // Extract shortcode from shortLink
      const shortcode = this.extractShortcodeFromLink(urlData.shortLink);
      
      const newEntry = {
        id: Date.now().toString(),
        originalUrl: originalUrl,
        shortLink: urlData.shortLink,
        shortcode: shortcode,
        expiry: urlData.expiry,
        createdAt: new Date().toISOString(),
        totalClicks: 0,
        clickDetails: []
      };

      data.shortenedUrls.unshift(newEntry); // Add to beginning of array
      this.saveData(data);
      
      loggingService.info('frontend', 'state', `Added new shortened URL: ${shortcode}`);
      return newEntry;
    } catch (error) {
      loggingService.error('frontend', 'state', `Failed to add shortened URL: ${error.message}`);
      return null;
    }
  }

  /**
   * Update statistics for a shortened URL
   * @param {string} shortcode - Shortcode to update
   * @param {Object} statsData - Statistics data from API
   */
  updateUrlStats(shortcode, statsData) {
    try {
      const data = this.getData();
      const urlIndex = data.shortenedUrls.findIndex(url => url.shortcode === shortcode);
      
      if (urlIndex !== -1) {
        const existingUrl = data.shortenedUrls[urlIndex];
        data.shortenedUrls[urlIndex] = {
          ...existingUrl,
          totalClicks: statsData.totalClicks || 0,
          clickDetails: statsData.clickDetails || [],
          isActive: statsData.isActive,
          lastUpdated: new Date().toISOString()
        };
        
        this.saveData(data);
        loggingService.debug('frontend', 'state', `Updated stats for ${shortcode}: ${statsData.totalClicks} clicks`);
        return data.shortenedUrls[urlIndex];
      } else {
        loggingService.warn('frontend', 'state', `URL not found in storage: ${shortcode}`);
        return null;
      }
    } catch (error) {
      loggingService.error('frontend', 'state', `Failed to update URL stats: ${error.message}`);
      return null;
    }
  }

  /**
   * Get all shortened URLs
   * @returns {Array} - Array of shortened URL objects
   */
  getAllShortenedUrls() {
    try {
      const data = this.getData();
      loggingService.debug('frontend', 'state', `Retrieved ${data.shortenedUrls.length} URLs from storage`);
      return data.shortenedUrls || [];
    } catch (error) {
      loggingService.error('frontend', 'state', `Failed to get shortened URLs: ${error.message}`);
      return [];
    }
  }

  /**
   * Get a specific shortened URL by shortcode
   * @param {string} shortcode - Shortcode to find
   * @returns {Object|null} - URL object or null if not found
   */
  getShortenedUrl(shortcode) {
    try {
      const data = this.getData();
      const url = data.shortenedUrls.find(url => url.shortcode === shortcode);
      
      if (url) {
        loggingService.debug('frontend', 'state', `Found URL in storage: ${shortcode}`);
      } else {
        loggingService.debug('frontend', 'state', `URL not found in storage: ${shortcode}`);
      }
      
      return url || null;
    } catch (error) {
      loggingService.error('frontend', 'state', `Failed to get shortened URL: ${error.message}`);
      return null;
    }
  }

  /**
   * Remove a shortened URL from storage
   * @param {string} shortcode - Shortcode to remove
   * @returns {boolean} - True if removed, false if not found
   */
  removeShortenedUrl(shortcode) {
    try {
      const data = this.getData();
      const urlIndex = data.shortenedUrls.findIndex(url => url.shortcode === shortcode);
      
      if (urlIndex !== -1) {
        data.shortenedUrls.splice(urlIndex, 1);
        this.saveData(data);
        loggingService.info('frontend', 'state', `Removed URL from storage: ${shortcode}`);
        return true;
      } else {
        loggingService.warn('frontend', 'state', `URL not found for removal: ${shortcode}`);
        return false;
      }
    } catch (error) {
      loggingService.error('frontend', 'state', `Failed to remove URL: ${error.message}`);
      return false;
    }
  }

  /**
   * Get all shortcodes for batch statistics fetching
   * @returns {Array} - Array of shortcodes
   */
  getAllShortcodes() {
    try {
      const urls = this.getAllShortenedUrls();
      const shortcodes = urls.map(url => url.shortcode).filter(Boolean);
      loggingService.debug('frontend', 'state', `Retrieved ${shortcodes.length} shortcodes`);
      return shortcodes;
    } catch (error) {
      loggingService.error('frontend', 'state', `Failed to get shortcodes: ${error.message}`);
      return [];
    }
  }

  /**
   * Clear all stored data
   */
  clearData() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      this.initializeStorage();
      loggingService.info('frontend', 'state', 'Cleared all stored data');
    } catch (error) {
      loggingService.error('frontend', 'state', `Failed to clear data: ${error.message}`);
    }
  }

  /**
   * Extract shortcode from a full short link URL
   * @param {string} shortLink - Full short link URL
   * @returns {string} - Extracted shortcode
   */
  extractShortcodeFromLink(shortLink) {
    try {
      if (!shortLink) return '';
      
      const url = new URL(shortLink);
      const shortcode = url.pathname.substring(1); // Remove leading slash
      
      loggingService.debug('frontend', 'state', `Extracted shortcode: ${shortcode} from ${shortLink}`);
      return shortcode;
    } catch (error) {
      loggingService.error('frontend', 'state', `Failed to extract shortcode from ${shortLink}: ${error.message}`);
      return '';
    }
  }

  /**
   * Get statistics summary
   * @returns {Object} - Summary statistics
   */
  getStatsSummary() {
    try {
      const urls = this.getAllShortenedUrls();
      
      const summary = {
        totalUrls: urls.length,
        totalClicks: urls.reduce((sum, url) => sum + (url.totalClicks || 0), 0),
        activeUrls: urls.filter(url => url.isActive !== false).length,
        recentUrls: urls.filter(url => {
          const createdDate = new Date(url.createdAt);
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return createdDate > dayAgo;
        }).length
      };
      
      loggingService.debug('frontend', 'state', `Stats summary: ${summary.totalUrls} URLs, ${summary.totalClicks} clicks`);
      return summary;
    } catch (error) {
      loggingService.error('frontend', 'state', `Failed to get stats summary: ${error.message}`);
      return {
        totalUrls: 0,
        totalClicks: 0,
        activeUrls: 0,
        recentUrls: 0
      };
    }
  }
}

// Create and export a singleton instance
const storageService = new StorageService();
export default storageService;
