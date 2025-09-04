import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  Tooltip,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  CircularProgress,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from '@mui/material';
import {
  BarChartRounded,
  RefreshRounded,
  ContentCopyRounded,
  OpenInNewRounded,
  DeleteRounded,
  VisibilityRounded,
  TrendingUpRounded,
  LinkRounded,
  AccessTimeRounded,
  CheckCircleRounded,
} from '@mui/icons-material';

// Import services
import apiService from '../../services/apiService';
import storageService from '../../services/storageService';
import loggingService from '../../services/loggingService';

const Dashboard = ({ urlData, onUrlsUpdated, backendStatus, showNotification }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [copiedUrls, setCopiedUrls] = useState({});

  const { shortenedUrls = [], lastUpdated } = urlData;

  // Calculate statistics
  const stats = {
    totalUrls: shortenedUrls.length,
    totalClicks: shortenedUrls.reduce((sum, url) => sum + (url.totalClicks || 0), 0),
    activeUrls: shortenedUrls.filter(url => !isExpired(url)).length,
    expiredUrls: shortenedUrls.filter(url => isExpired(url)).length,
  };

  function isExpired(url) {
    if (!url.expiry) return false;
    return new Date(url.expiry) < new Date();
  }

  const handleRefreshStats = async () => {
    if (backendStatus !== 'healthy') {
      showNotification('Backend server is not available', 'error');
      return;
    }

    if (shortenedUrls.length === 0) {
      showNotification('No URLs to refresh', 'info');
      return;
    }

    setIsRefreshing(true);
    
    try {
      loggingService.info('frontend', 'dashboard', 'Refreshing URL statistics');
      
      const shortcodes = shortenedUrls.map(url => url.shortcode);
      const updatedStats = await apiService.getAllUrlStats(shortcodes);
      
      // Update storage with new stats
      updatedStats.forEach(statData => {
        if (statData?.data) {
          storageService.updateUrlStats(statData.data.shortcode, statData.data);
        }
      });
      
      onUrlsUpdated();
      showNotification(`Updated statistics for ${updatedStats.length} URLs`, 'success');
      
    } catch (error) {
      loggingService.error('frontend', 'dashboard', `Failed to refresh stats: ${error.message}`);
      showNotification(`Failed to refresh statistics: ${error.message}`, 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCopyUrl = async (shortLink) => {
    try {
      await navigator.clipboard.writeText(shortLink);
      setCopiedUrls(prev => ({ ...prev, [shortLink]: true }));
      showNotification('URL copied to clipboard!', 'success');
      setTimeout(() => {
        setCopiedUrls(prev => ({ ...prev, [shortLink]: false }));
      }, 2000);
    } catch (error) {
      showNotification('Failed to copy URL', 'error');
    }
  };

  const handleOpenUrl = (shortLink) => {
    window.open(shortLink, '_blank');
  };

  const handleViewDetails = async (url) => {
    setSelectedUrl(url);
    setDetailsOpen(true);
    
    // Try to fetch fresh stats for this URL
    if (backendStatus === 'healthy') {
      try {
        const freshStats = await apiService.getUrlStats(url.shortcode);
        if (freshStats?.data) {
          storageService.updateUrlStats(url.shortcode, freshStats.data);
          onUrlsUpdated();
          
          // Update the selected URL with fresh data
          const updatedData = storageService.getData();
          const updatedUrl = updatedData.shortenedUrls.find(u => u.shortcode === url.shortcode);
          if (updatedUrl) {
            setSelectedUrl(updatedUrl);
          }
        }
      } catch (error) {
        loggingService.warn('frontend', 'dashboard', `Failed to fetch fresh stats for ${url.shortcode}`);
      }
    }
  };

  const handleDeleteUrl = (url) => {
    storageService.removeShortenedUrl(url.shortcode);
    onUrlsUpdated();
    showNotification('URL removed from dashboard', 'success');
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusChip = (url) => {
    if (isExpired(url)) {
      return <Chip label="Expired" color="error" size="small" />;
    }
    return <Chip label="Active" color="success" size="small" />;
  };

  const paginatedUrls = shortenedUrls.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 4, mb: 4, textAlign: 'center' }}>
        <BarChartRounded sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage and track your shortened URLs with detailed analytics.
        </Typography>
      </Paper>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <LinkRounded sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" color="primary.main" fontWeight="bold">
                {stats.totalUrls}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total URLs
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUpRounded sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {stats.totalClicks}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Clicks
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircleRounded sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" color="info.main" fontWeight="bold">
                {stats.activeUrls}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active URLs
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <AccessTimeRounded sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" color="warning.main" fontWeight="bold">
                {stats.expiredUrls}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Expired URLs
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Actions */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            URL Management
          </Typography>
          <Button
            variant="contained"
            startIcon={isRefreshing ? <CircularProgress size={16} /> : <RefreshRounded />}
            onClick={handleRefreshStats}
            disabled={isRefreshing || backendStatus !== 'healthy' || shortenedUrls.length === 0}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh Stats'}
          </Button>
        </Box>
        
        {lastUpdated && (
          <Typography variant="body2" color="text.secondary">
            Last updated: {formatDate(lastUpdated)}
          </Typography>
        )}
      </Paper>

      {/* URLs Table */}
      {shortenedUrls.length === 0 ? (
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
          <LinkRounded sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No URLs Created Yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Start by creating your first short URL using the URL Shortener tab.
          </Typography>
        </Paper>
      ) : (
        <Paper elevation={2}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Original URL</TableCell>
                  <TableCell>Short URL</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Clicks</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedUrls.map((url) => (
                  <TableRow key={url.id} hover>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {url.originalUrl}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: 'monospace',
                          color: 'primary.main',
                          maxWidth: 150,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {url.shortLink}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {getStatusChip(url)}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {url.totalClicks || 0}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(url.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(url)}
                          >
                            <VisibilityRounded />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={copiedUrls[url.shortLink] ? 'Copied!' : 'Copy URL'}>
                          <IconButton
                            size="small"
                            onClick={() => handleCopyUrl(url.shortLink)}
                            color={copiedUrls[url.shortLink] ? 'success' : 'default'}
                          >
                            {copiedUrls[url.shortLink] ? <CheckCircleRounded /> : <ContentCopyRounded />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Open URL">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenUrl(url.shortLink)}
                          >
                            <OpenInNewRounded />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove from Dashboard">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteUrl(url)}
                            color="error"
                          >
                            <DeleteRounded />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={shortenedUrls.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      )}

      {/* URL Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          URL Details
        </DialogTitle>
        <DialogContent dividers>
          {selectedUrl && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Original URL
                </Typography>
                <Typography variant="body1" sx={{ wordBreak: 'break-all', mb: 2 }}>
                  {selectedUrl.originalUrl}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Short URL
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    wordBreak: 'break-all', 
                    fontFamily: 'monospace',
                    color: 'primary.main',
                    mb: 2 
                  }}
                >
                  {selectedUrl.shortLink}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <Box sx={{ mb: 2 }}>
                  {getStatusChip(selectedUrl)}
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Total Clicks
                </Typography>
                <Typography variant="h6" color="primary.main" sx={{ mb: 2 }}>
                  {selectedUrl.totalClicks || 0}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Created At
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {formatDate(selectedUrl.createdAt)}
                </Typography>
              </Grid>
              
              {selectedUrl.expiry && (
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Expires At
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {formatDate(selectedUrl.expiry)}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>
            Close
          </Button>
          {selectedUrl && (
            <>
              <Button
                onClick={() => handleCopyUrl(selectedUrl.shortLink)}
                startIcon={<ContentCopyRounded />}
              >
                Copy URL
              </Button>
              <Button
                onClick={() => handleOpenUrl(selectedUrl.shortLink)}
                startIcon={<OpenInNewRounded />}
                variant="contained"
              >
                Open URL
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
