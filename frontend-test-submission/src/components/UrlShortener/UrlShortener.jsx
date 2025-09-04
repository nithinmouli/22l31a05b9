import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  InputAdornment,
  Collapse,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  LinkRounded,
  ContentCopyRounded,
  OpenInNewRounded,
  CheckCircleRounded,
  ErrorRounded,
  ExpandMoreRounded,
  ExpandLessRounded,
} from '@mui/icons-material';

// Import services
import apiService from '../../services/apiService';
import validationService from '../../services/validationService';
import loggingService from '../../services/loggingService';

const UrlShortener = ({ onUrlCreated, backendStatus, showNotification }) => {
  const [formData, setFormData] = useState({
    url: '',
    shortcode: '',
    validity: '',
  });
  const [validation, setValidation] = useState({
    url: { isValid: true, error: null },
    shortcode: { isValid: true, error: null },
    validity: { isValid: true, error: null },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Real-time validation on input change
  useEffect(() => {
    if (formData.url) {
      const urlValidation = validationService.validateUrl(formData.url);
      setValidation(prev => ({ ...prev, url: urlValidation }));
    } else {
      setValidation(prev => ({ ...prev, url: { isValid: true, error: null } }));
    }
  }, [formData.url]);

  useEffect(() => {
    if (formData.shortcode) {
      const shortcodeValidation = validationService.validateShortcode(formData.shortcode);
      setValidation(prev => ({ ...prev, shortcode: shortcodeValidation }));
    } else {
      setValidation(prev => ({ ...prev, shortcode: { isValid: true, error: null } }));
    }
  }, [formData.shortcode]);

  useEffect(() => {
    if (formData.validity) {
      // Convert days to minutes for validation
      const validityInMinutes = formData.validity ? parseInt(formData.validity) * 24 * 60 : null;
      const validityValidation = validationService.validateValidity(validityInMinutes);
      setValidation(prev => ({ ...prev, validity: validityValidation }));
    } else {
      setValidation(prev => ({ ...prev, validity: { isValid: true, error: null } }));
    }
  }, [formData.validity]);

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear result when user starts editing
    if (result) {
      setResult(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (backendStatus !== 'healthy') {
      showNotification('Backend server is not available. Please try again later.', 'error');
      return;
    }

    // Validate all fields
    const urlValidation = validationService.validateUrl(formData.url);
    if (!urlValidation.isValid) {
      showNotification(`URL Error: ${urlValidation.error}`, 'error');
      return;
    }

    if (formData.shortcode) {
      const shortcodeValidation = validationService.validateShortcode(formData.shortcode);
      if (!shortcodeValidation.isValid) {
        showNotification(`Shortcode Error: ${shortcodeValidation.error}`, 'error');
        return;
      }
    }

    if (formData.validity) {
      // Convert days to minutes for validation
      const validityInMinutes = parseInt(formData.validity) * 24 * 60;
      const validityValidation = validationService.validateValidity(validityInMinutes);
      if (!validityValidation.isValid) {
        showNotification(`Validity Error: ${validityValidation.error}`, 'error');
        return;
      }
    }

    setIsLoading(true);
    
    try {
      loggingService.info('frontend', 'ui', 'User attempting to create short URL');
      
      const response = await apiService.createShortUrl(
        formData.url,
        formData.validity ? parseInt(formData.validity) : null,
        formData.shortcode || null
      );

      setResult(response);
      onUrlCreated(response, formData.url);
      
      // Clear form
      setFormData({ url: '', shortcode: '', validity: '' });
      setShowAdvanced(false);
      
      loggingService.info('frontend', 'ui', 'Short URL created successfully');
    } catch (error) {
      loggingService.error('frontend', 'ui', `Failed to create short URL: ${error.message}`);
      showNotification(`Failed to create short URL: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyUrl = async () => {
    if (result?.shortLink) {
      try {
        await navigator.clipboard.writeText(result.shortLink);
        setCopiedUrl(true);
        showNotification('Short URL copied to clipboard!', 'success');
        setTimeout(() => setCopiedUrl(false), 2000);
      } catch (error) {
        showNotification('Failed to copy URL', 'error');
      }
    }
  };

  const handleOpenUrl = () => {
    if (result?.shortLink) {
      window.open(result.shortLink, '_blank');
    }
  };

  const isFormValid = () => {
    return (
      formData.url &&
      validation.url.isValid &&
      validation.shortcode.isValid &&
      validation.validity.isValid
    );
  };

  return (
    <Box>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 4, mb: 4, textAlign: 'center' }}>
        <LinkRounded sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          URL Shortener
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Transform long URLs into short, shareable links with optional custom codes and expiry dates.
        </Typography>
      </Paper>

      {/* Backend Status Alert */}
      {backendStatus !== 'healthy' && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Backend server is {backendStatus}. The URL shortener functionality may not work properly.
        </Alert>
      )}

      {/* Main Form */}
      <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* URL Input */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Enter URL to shorten"
                placeholder="https://example.com/very-long-url-that-needs-shortening"
                value={formData.url}
                onChange={handleInputChange('url')}
                error={!validation.url.isValid}
                helperText={validation.url.error || 'Enter a valid URL starting with http:// or https://'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LinkRounded color={validation.url.isValid ? 'primary' : 'error'} />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
            </Grid>

            {/* Advanced Options Toggle */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showAdvanced}
                    onChange={(e) => setShowAdvanced(e.target.checked)}
                    color="primary"
                  />
                }
                label="Show Advanced Options"
              />
            </Grid>

            {/* Advanced Options */}
            <Grid item xs={12}>
              <Collapse in={showAdvanced}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Custom Shortcode (Optional)"
                      placeholder="my-custom-code"
                      value={formData.shortcode}
                      onChange={handleInputChange('shortcode')}
                      error={!validation.shortcode.isValid}
                      helperText={validation.shortcode.error || 'Leave empty for auto-generated code'}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Validity Period (Optional)"
                      placeholder="7"
                      type="number"
                      value={formData.validity}
                      onChange={handleInputChange('validity')}
                      error={!validation.validity.isValid}
                      helperText={validation.validity.error || 'Number of days (leave empty for permanent)'}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">days</InputAdornment>,
                      }}
                    />
                  </Grid>
                </Grid>
              </Collapse>
            </Grid>

            {/* Submit Button */}
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={!isFormValid() || isLoading || backendStatus !== 'healthy'}
                startIcon={isLoading ? <CircularProgress size={20} /> : <LinkRounded />}
                sx={{ py: 1.5, fontSize: '1.1rem' }}
              >
                {isLoading ? 'Creating Short URL...' : 'Shorten URL'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Result Card */}
      {result && (
        <Card elevation={3} sx={{ mb: 4, border: '2px solid', borderColor: 'success.main' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CheckCircleRounded sx={{ color: 'success.main', mr: 1 }} />
              <Typography variant="h6" color="success.main">
                URL Shortened Successfully!
              </Typography>
            </Box>
            
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={8}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Short URL:
                </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    wordBreak: 'break-all',
                    color: 'primary.main',
                    fontFamily: 'monospace',
                    backgroundColor: 'grey.100',
                    p: 1,
                    borderRadius: 1,
                  }}
                >
                  {result.shortLink}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Tooltip title={copiedUrl ? 'Copied!' : 'Copy to clipboard'}>
                    <IconButton
                      onClick={handleCopyUrl}
                      color={copiedUrl ? 'success' : 'primary'}
                      size="large"
                    >
                      {copiedUrl ? <CheckCircleRounded /> : <ContentCopyRounded />}
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Open in new tab">
                    <IconButton
                      onClick={handleOpenUrl}
                      color="primary"
                      size="large"
                    >
                      <OpenInNewRounded />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>
            </Grid>

            {/* Additional Info */}
            <Box sx={{ mt: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {result.expiry && (
                <Chip
                  label={`Expires: ${new Date(result.expiry).toLocaleDateString()}`}
                  color="warning"
                  variant="outlined"
                  size="small"
                />
              )}
              <Chip
                label="Permanent"
                color="success"
                variant="outlined"
                size="small"
                sx={{ display: result.expiry ? 'none' : 'flex' }}
              />
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default UrlShortener;
