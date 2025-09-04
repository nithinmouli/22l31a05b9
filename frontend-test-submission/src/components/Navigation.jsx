import React from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Box,
    Button,
    Container,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    Link as LinkIcon,
    BarChart as BarChartIcon,
    Home as HomeIcon
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';
import logger from '../services/loggingService.js';

const Navigation = () => {
    const location = useLocation();

    const handleNavigation = (path, pageName) => {
        logger.info('component', `Navigating to ${pageName} page`);
    };

    const isActive = (path) => location.pathname === path;

    return (
        <AppBar position="static" elevation={2}>
            <Container maxWidth="lg">
                <Toolbar sx={{ justifyContent: 'space-between' }}>
                    <Box display="flex" alignItems="center">
                        <IconButton
                            component={Link}
                            to="/"
                            onClick={() => handleNavigation('/', 'URL Shortener')}
                            color="inherit"
                            sx={{ mr: 1 }}
                        >
                            <HomeIcon />
                        </IconButton>
                        <Typography variant="h6" component="div" fontWeight="bold">
                            URL Shortener App
                        </Typography>
                    </Box>

                    <Box display="flex" gap={1}>
                        <Button
                            component={Link}
                            to="/"
                            onClick={() => handleNavigation('/', 'URL Shortener')}
                            color="inherit"
                            startIcon={<LinkIcon />}
                            variant={isActive('/') ? 'outlined' : 'text'}
                            sx={{
                                backgroundColor: isActive('/') ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                                borderColor: isActive('/') ? 'rgba(255, 255, 255, 0.5)' : 'transparent'
                            }}
                        >
                            Shortener
                        </Button>
                        
                        <Button
                            component={Link}
                            to="/statistics"
                            onClick={() => handleNavigation('/statistics', 'Statistics')}
                            color="inherit"
                            startIcon={<BarChartIcon />}
                            variant={isActive('/statistics') ? 'outlined' : 'text'}
                            sx={{
                                backgroundColor: isActive('/statistics') ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                                borderColor: isActive('/statistics') ? 'rgba(255, 255, 255, 0.5)' : 'transparent'
                            }}
                        >
                            Statistics
                        </Button>
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    );
};

export default Navigation;
