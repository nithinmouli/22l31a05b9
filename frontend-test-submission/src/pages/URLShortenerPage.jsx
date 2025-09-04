import React, { useState } from 'react';
import {
    Container, Paper, Typography, Grid, TextField, Button, Alert, Card, CardContent, Box, Chip, IconButton, CircularProgress, Divider
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, ContentCopy as CopyIcon, Link as LinkIcon, AccessTime as TimeIcon, Code as CodeIcon } from '@mui/icons-material';
import apiService from '../services/apiService.js';
import logger from '../services/loggingService.js';
import { validateUrl, validateValidity, validateShortcode, formatExpiryDate } from '../utils/validation.js';
const URLShortenerPage = () => {
    const [urlEntries, setUrlEntries] = useState([
        { id: 1, url: '', validity: '', shortcode: '', errors: {}, loading: false, result: null }
    ]);
    const [globalError, setGlobalError] = useState('');
    const [globalSuccess, setGlobalSuccess] = useState('');
    React.useEffect(() => {
        logger.info('page', 'URL Shortener page loaded');
    }, []);
    const addUrlEntry = () => {
        if (urlEntries.length >= 5) {
            setGlobalError('You can only shorten up to 5 URLs at once');
            return;
        }
        setUrlEntries([...urlEntries, {
            id: Date.now(),    url: '', validity: '', shortcode: '',errors: {},          loading: false,       result: null
        }]);
        logger.info('component', `Added new URL entry. Total entries: ${urlEntries.length + 1}`);
    };
    const removeUrlEntry = (id) => {
        if (urlEntries.length <= 1) return;
        setUrlEntries(urlEntries.filter(entry => entry.id !== id));
        logger.info('component', `Removed URL entry ${id}`);
    };
    const updateUrlEntry = (id, field, value) => {
        setUrlEntries(urlEntries.map(entry => 
            entry.id === id ? { ...entry, [field]: value, errors: { ...entry.errors, [field]: '' } } : entry
        ));
        setGlobalError('');
        setGlobalSuccess('');
    };
    const validateEntry = (entry) => {
        const errors = {};
        const urlVal = validateUrl(entry.url);
        const validityVal = validateValidity(entry.validity);
        const shortcodeVal = validateShortcode(entry.shortcode);   
        if (!urlVal.isValid) errors.url = urlVal.error;
        if (!validityVal.isValid) errors.validity = validityVal.error;
        if (!shortcodeVal.isValid) errors.shortcode = shortcodeVal.error;
        return {
            isValid: Object.keys(errors).length === 0,
            errors,
            validatedData: { url: urlVal.value, validity: validityVal.value, shortcode: shortcodeVal.value }
        };
    };
    const shortenUrl = async (entryId) => {
        const entry = urlEntries.find(e => e.id === entryId);
        if (!entry) return;
        const validation = validateEntry(entry);
        setUrlEntries(urlEntries.map(e => 
            e.id === entryId ? { ...e, errors: validation.errors, loading: validation.isValid } : e
        ));
        if (!validation.isValid) return;
        try {
            const response = await apiService.createShortUrl(validation.validatedData);
            if (response.success) {
                setUrlEntries(urlEntries.map(e => 
                    e.id === entryId ? { 
                        ...e, 
                        loading: false, 
                        result: { shortLink: response.shortLink, expiry: response.expiry, message: response.message }
                    } : e
                ));
                setGlobalSuccess('URL shortened successfully!');
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Failed to shorten URL';
            setUrlEntries(urlEntries.map(e => 
                e.id === entryId ? { ...e, loading: false, errors: { submit: errorMessage } } : e
            ));
            setGlobalError(errorMessage);
        }
    };
    const shortenAllUrls = async () => {
        const validEntries = urlEntries.filter(entry => {
            const validation = validateEntry(entry);
            entry.errors = validation.errors;
            return validation.isValid && !entry.result;
        });

        if (validEntries.length === 0) {
            setGlobalError('No valid URLs to shorten');
            return;
        }

        setUrlEntries(prev => prev.map(entry => 
            validEntries.some(ve => ve.id === entry.id) ? { ...entry, loading: true } : entry
        ));
        const results = await Promise.allSettled(
            validEntries.map(async (entry) => {
                try {
                    const validation = validateEntry(entry);
                    const response = await apiService.createShortUrl(validation.validatedData);
                    return { entryId: entry.id, success: true, data: response };
                } catch (error) {
                    return { entryId: entry.id, success: false, error: error.response?.data?.message || error.message };
                }
            })
        );
        setUrlEntries(prev => prev.map(entry => {
            const result = results.find(r => r.value?.entryId === entry.id);
            if (!result) return { ...entry, loading: false };

            if (result.status === 'fulfilled' && result.value.success && result.value.data.success) {
                return {
                    ...entry,
                    loading: false,
                    result: {
                        shortLink: result.value.data.shortLink,
                        expiry: result.value.data.expiry,
                        message: result.value.data.message
                    }
                };
            } else {
                return { ...entry, loading: false, errors: { ...entry.errors, submit: result.value?.error || 'Failed to shorten URL' } };
            }
        }));
        const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success && r.value.data.success).length;
        if (successCount > 0) setGlobalSuccess(`${successCount} URL(s) shortened successfully!`);
        if (successCount < validEntries.length) setGlobalError(`${validEntries.length - successCount} URL(s) failed to shorten`);
    };
    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            setGlobalSuccess('Copied to clipboard!');
        } catch (error) {
            setGlobalError('Failed to copy to clipboard');
        }
    };
    const clearResults = () => {
        setUrlEntries(urlEntries.map(entry => ({ ...entry, result: null, errors: {} })));
        setGlobalError('');
        setGlobalSuccess('');
    };
    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Box display="flex" alignItems="center" mb={3}>
                    <LinkIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
                    <Typography variant="h4" component="h1" fontWeight="bold">
                        URL Shortener
                    </Typography>
                </Box>

                <Typography variant="body1" color="text.secondary" mb={4}>
                    Shorten up to 5 URLs at once. Each URL can have a custom validity period and shortcode.
                </Typography>

                {globalError && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setGlobalError('')}>
                        {globalError}
                    </Alert>
                )}

                {globalSuccess && (
                    <Alert severity="success" sx={{ mb: 3 }} onClose={() => setGlobalSuccess('')}>
                        {globalSuccess}
                    </Alert>
                )}

                <Grid container spacing={3}>
                    {urlEntries.map((entry, index) => (
                        <Grid item xs={12} key={entry.id}>
                            <Card variant="outlined" sx={{ position: 'relative' }}>
                                <CardContent>
                                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                                        <Typography variant="h6" component="h3">
                                            URL #{index + 1}
                                        </Typography>
                                        {urlEntries.length > 1 && (
                                            <IconButton
                                                onClick={() => removeUrlEntry(entry.id)}
                                                color="error"
                                                size="small"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        )}
                                    </Box>

                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                            <TextField
                                                label="Original URL"
                                                placeholder="https://example.com/very/long/url"
                                                value={entry.url}
                                                onChange={(e) => updateUrlEntry(entry.id, 'url', e.target.value)}
                                                error={!!entry.errors.url}
                                                helperText={entry.errors.url}
                                                fullWidth
                                                required
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                label="Validity (minutes)"
                                                placeholder="e.g., 60"
                                                value={entry.validity}
                                                onChange={(e) => updateUrlEntry(entry.id, 'validity', e.target.value)}
                                                error={!!entry.errors.validity}
                                                helperText={entry.errors.validity || 'Optional: Leave empty for default'}
                                                type="number"
                                                fullWidth
                                            />
                                        </Grid>

                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                label="Custom Shortcode"
                                                placeholder="e.g., mylink"
                                                value={entry.shortcode}
                                                onChange={(e) => updateUrlEntry(entry.id, 'shortcode', e.target.value)}
                                                error={!!entry.errors.shortcode}
                                                helperText={entry.errors.shortcode || 'Optional: 4-10 alphanumeric characters'}
                                                fullWidth
                                            />
                                        </Grid>

                                        <Grid item xs={12}>
                                            <Box display="flex" gap={2} alignItems="center">
                                                <Button
                                                    variant="contained"
                                                    onClick={() => shortenUrl(entry.id)}
                                                    disabled={entry.loading || !entry.url.trim()}
                                                    startIcon={entry.loading ? <CircularProgress size={20} /> : <LinkIcon />}
                                                >
                                                    {entry.loading ? 'Shortening...' : 'Shorten URL'}
                                                </Button>

                                                {entry.errors.submit && (
                                                    <Alert severity="error" sx={{ flex: 1 }}>
                                                        {entry.errors.submit}
                                                    </Alert>
                                                )}
                                            </Box>
                                        </Grid>

                                        {entry.result && (
                                            <Grid item xs={12}>
                                                <Alert severity="success" sx={{ mt: 2 }}>
                                                    <Typography variant="subtitle2" gutterBottom>
                                                        Short URL Created Successfully!
                                                    </Typography>
                                                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                                                        <Typography variant="body2" sx={{ wordBreak: 'break-all', flex: 1 }}>
                                                            <strong>Short Link:</strong> {entry.result.shortLink}
                                                        </Typography>
                                                        <IconButton size="small" onClick={() => copyToClipboard(entry.result.shortLink)}>
                                                            <CopyIcon />
                                                        </IconButton>
                                                    </Box>
                                                    <Typography variant="body2">
                                                        <strong>Expires:</strong> {formatExpiryDate(entry.result.expiry)}
                                                    </Typography>
                                                </Alert>
                                            </Grid>
                                        )}
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                <Divider sx={{ my: 4 }} />

                <Box display="flex" gap={2} flexWrap="wrap" justifyContent="center">
                    <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={addUrlEntry}
                        disabled={urlEntries.length >= 5}
                    >
                        Add Another URL {urlEntries.length >= 5 && '(Max 5)'}
                    </Button>

                    <Button
                        variant="contained"
                        size="large"
                        onClick={shortenAllUrls}
                        disabled={urlEntries.every(entry => !entry.url.trim() || entry.result || entry.loading)}
                        startIcon={urlEntries.some(entry => entry.loading) ? <CircularProgress size={20} /> : <LinkIcon />}
                    >
                        {urlEntries.some(entry => entry.loading) ? 'Processing...' : 'Shorten All URLs'}
                    </Button>

                    <Button
                        variant="outlined"
                        onClick={clearResults}
                        disabled={!urlEntries.some(entry => entry.result)}
                    >
                        Clear Results
                    </Button>
                </Box>

                <Box mt={3} display="flex" justifyContent="center" flexWrap="wrap" gap={1}>
                    <Chip label={`${urlEntries.length}/5 URLs`} variant="outlined" />
                    <Chip 
                        label={`${urlEntries.filter(e => e.result).length} Shortened`} 
                        color="success" 
                        variant="outlined" 
                    />
                </Box>
            </Paper>
        </Container>
    );
};

export default URLShortenerPage;
