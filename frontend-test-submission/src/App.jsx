import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Box, Alert, Snackbar, Backdrop, CircularProgress, Typography } from '@mui/material'
import Navigation from './components/Navigation.jsx'
import Footer from './components/Footer.jsx'
import URLShortenerPage from './pages/URLShortenerPage.jsx'
import StatisticsPage from './pages/StatisticsPage_new.jsx'
import apiService from './services/apiService.js'
import logger from './services/loggingService.js'

function App() {
  const [backendStatus, setBackendStatus] = useState('checking')
  const [appError, setAppError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeApp = async () => {
      try {
        logger.info('component', 'App component initializing')
        
        const isBackendHealthy = await apiService.checkBackendHealth()
        
        if (isBackendHealthy) {
          setBackendStatus('connected')
          logger.info('component', 'Backend connectivity verified')
        } else {
          setBackendStatus('error')
          setAppError('Cannot connect to backend service. Please ensure the backend is running on http://localhost:8000')
          logger.error('component', 'Backend connectivity failed')
        }
      } catch (error) {
        setBackendStatus('error')
        setAppError('Failed to initialize application: ' + error.message)
        logger.error('component', `App initialization failed: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    initializeApp()
  }, [])

  if (loading || backendStatus === 'checking') {
    return (
      <Backdrop open={true} sx={{ color: '#fff', zIndex: 9999 }}>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <CircularProgress color="inherit" />
          <Typography variant="h6">Initializing URL Shortener...</Typography>
          <Typography variant="body2">Checking backend connectivity...</Typography>
        </Box>
      </Backdrop>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navigation />
      
      {backendStatus === 'error' && (
        <Alert 
          severity="error" 
          sx={{ m: 2 }}
          action={
            <button onClick={() => window.location.reload()}>
              Retry
            </button>
          }
        >
          {appError}
        </Alert>
      )}

      <Box component="main" sx={{ flex: 1, backgroundColor: 'grey.50', minHeight: 'calc(100vh - 120px)' }}>
        <Routes>
          <Route path="/" element={<URLShortenerPage />} />
          <Route path="/statistics" element={<StatisticsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>

      <Footer />

      <Snackbar
        open={!!appError && backendStatus !== 'error'}
        autoHideDuration={6000}
        onClose={() => setAppError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setAppError('')}>
          {appError}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default App
