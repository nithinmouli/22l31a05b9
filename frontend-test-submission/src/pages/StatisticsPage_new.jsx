import React, { useState } from 'react';
import apiService from '../services/apiService.js';
import logger from '../services/loggingService.js';
import './StatisticsPage.css';

const StatisticsPage = () => {
    const [urls, setUrls] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchShortcode, setSearchShortcode] = useState('');

    React.useEffect(() => {
        logger.info('page', 'Statistics page loaded');
    }, []);

    const loadStats = async () => {
        if (!searchShortcode.trim()) {
            setError('Please enter a shortcode');
            return;
        }

        if (urls.some(url => url.shortcode === searchShortcode.trim())) {
            setError('URL already in list');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await apiService.getUrlStats(searchShortcode.trim());
            if (response.success) {
                setUrls(prev => [{ id: Date.now(), ...response.data }, ...prev]);
                setSearchShortcode('');
                logger.info('component', `Stats loaded for ${searchShortcode}`);
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to load statistics');
            logger.error('component', `Failed to load stats: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') loadStats();
    };

    return (
        <div className="stats-container">
            <div className="stats-header">
                <h1>📊 URL Statistics</h1>
                <p>View detailed analytics for your shortened URLs</p>
            </div>

            {error && (
                <div className="alert error">
                    {error}
                    <button onClick={() => setError('')} className="alert-close">×</button>
                </div>
            )}

            <div className="search-section">
                <h3>Load URL Statistics</h3>
                <div className="search-input-group">
                    <input
                        type="text"
                        placeholder="Enter shortcode (e.g., abc123)"
                        value={searchShortcode}
                        onChange={(e) => setSearchShortcode(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="search-input"
                    />
                    <button
                        onClick={loadStats}
                        disabled={loading || !searchShortcode.trim()}
                        className="search-button"
                    >
                        {loading ? '⏳ Loading...' : '🔍 Load Stats'}
                    </button>
                </div>
            </div>

            {urls.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📈</div>
                    <h3>No URLs to display</h3>
                    <p>Enter a shortcode above to load its statistics</p>
                </div>
            ) : (
                <div className="urls-list">
                    {urls.map((url) => (
                        <div key={url.id} className="url-card">
                            <div className="url-header">
                                <h3>/{url.shortcode}</h3>
                                <span className={`status ${url.isActive ? 'active' : 'inactive'}`}>
                                    {url.isActive ? '✅ Active' : '❌ Inactive'}
                                </span>
                            </div>
                            
                            <div className="url-details">
                                <p><strong>Original URL:</strong> {url.originalUrl}</p>
                                <div className="url-stats">
                                    <span><strong>Created:</strong> {new Date(url.createdAt).toLocaleString()}</span>
                                    <span><strong>Expires:</strong> {new Date(url.expiry).toLocaleString()}</span>
                                    <span><strong>Total Clicks:</strong> {url.totalClicks}</span>
                                </div>
                            </div>

                            {url.clickDetails && url.clickDetails.length > 0 && (
                                <div className="click-details">
                                    <h4>Click History</h4>
                                    <table className="clicks-table">
                                        <thead>
                                            <tr>
                                                <th>Timestamp</th>
                                                <th>Source</th>
                                                <th>Location</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {url.clickDetails.slice(0, 10).map((click, i) => (
                                                <tr key={i}>
                                                    <td>{new Date(click.timestamp).toLocaleString()}</td>
                                                    <td>{click.referrer || 'Direct'}</td>
                                                    <td>{click.location || 'Unknown'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {url.clickDetails.length > 10 && (
                                        <p className="more-clicks">
                                            Showing 10 of {url.clickDetails.length} clicks
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StatisticsPage;
