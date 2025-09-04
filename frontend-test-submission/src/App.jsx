import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import components
import UrlShortener from './components/UrlShortener/UrlShortener';
import Dashboard from './components/Dashboard/Dashboard';
import Navigation from './components/Navigation/Navigation';
import Notification from './components/Notification/Notification';

// Import services
import apiService from './services/apiService';
import loggingService from './services/loggingService';
import storageService from './services/storageService';

// Import styles
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('shortener');
  const [backendStatus, setBackendStatus] = useState('checking');
  const [notification, setNotification] = useState({ open: false, message: '', type: 'info' });
  const [urlData, setUrlData] = useState({ shortenedUrls: [], lastUpdated: null });

  // Initialize application
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      loggingService.info('frontend', 'component', 'Initializing application');
      
      // Load stored data
      const storedData = storageService.getData();
      setUrlData(storedData);
      
      // Check backend health
      const isHealthy = await apiService.checkBackendHealth();
      setBackendStatus(isHealthy ? 'healthy' : 'offline');
      
      if (!isHealthy) {
        showNotification('Backend server is offline. Some features may not work properly.', 'warning');
      }
      
      loggingService.info('frontend', 'component', 'Application initialized successfully');
    } catch (error) {
      loggingService.error('frontend', 'component', `Failed to initialize app: ${error.message}`);
      setBackendStatus('error');
      showNotification('Failed to initialize application', 'error');
    }
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ open: true, message, type });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const handleUrlCreated = (newUrlData, originalUrl) => {
    // Add to storage and update state
    const newEntry = storageService.addShortenedUrl(newUrlData, originalUrl);
    if (newEntry) {
      const updatedData = storageService.getData();
      setUrlData(updatedData);
      showNotification('URL shortened successfully!', 'success');
    }
  };

  const handleUrlsUpdated = () => {
    // Refresh data from storage
    const updatedData = storageService.getData();
    setUrlData(updatedData);
  };

  const getStatusText = () => {
    switch (backendStatus) {
      case 'healthy': return 'Backend Online';
      case 'offline': return 'Backend Offline';
      case 'error': return 'Backend Error';
      default: return 'Checking Backend...';
    }
  };

  return (
    <div className="app">
      <Router>
        {/* Header */}
        <header className="app-header">
          <div className="header-content">
            <div className="header-left">
              <div className="app-logo">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                URL Shortener
              </div>
            </div>
            <div className="header-right">
              <span className="backend-status">
                <span className={`status-indicator status-${backendStatus}`}></span>
                {getStatusText()}
              </span>
            </div>
          </div>
        </header>

        {/* Navigation */}
        <Navigation currentView={currentView} onViewChange={setCurrentView} />

        {/* Main Content */}
        <main className="main-content">
          <div className="container">
            <Routes>
              <Route 
                path="/" 
                element={<Navigate to="/shortener" replace />} 
              />
              <Route 
                path="/shortener" 
                element={
                  <UrlShortener 
                    onUrlCreated={handleUrlCreated}
                    backendStatus={backendStatus}
                    showNotification={showNotification}
                  />
                } 
              />
              <Route 
                path="/dashboard" 
                element={
                  <Dashboard 
                    urlData={urlData}
                    onUrlsUpdated={handleUrlsUpdated}
                    backendStatus={backendStatus}
                    showNotification={showNotification}
                  />
                } 
              />
            </Routes>
          </div>
        </main>

        {/* Global Notifications */}
        <Notification
          isOpen={notification.open}
          message={notification.message}
          type={notification.type}
          onClose={handleCloseNotification}
        />
      </Router>
    </div>
  );
}

export default App;
