import React from 'react';
import { Box, Container, Typography, Link as MuiLink, Divider } from '@mui/material';
import { GitHub as GitHubIcon, Link as LinkIcon } from '@mui/icons-material';
import logger from '../services/loggingService.js';

const Footer = () => {
    React.useEffect(() => {
        logger.debug('component', 'Footer component mounted');
    }, []);

    return (
        <Box
            component="footer"
            sx={{
                mt: 'auto',
                py: 3,
                px: 2,
                backgroundColor: 'background.paper',
                borderTop: 1,
                borderColor: 'divider'
            }}
        >
            <Container maxWidth="lg">
                <Box display="flex" justifyContent="center" alignItems="center" flexDirection="column" gap={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <LinkIcon color="primary" />
                        <Typography variant="body2" color="text.secondary">
                            URL Shortener Web Application
                        </Typography>
                    </Box>
                    
                    <Typography variant="caption" color="text.secondary" textAlign="center">
                        Built with React, Material UI, and extensive logging integration
                    </Typography>
                    
                    <Typography variant="caption" color="text.secondary" textAlign="center">
                        © 2025 - Developed for AffordMed Technologies Assessment
                    </Typography>
                </Box>
            </Container>
        </Box>
    );
};

export default Footer;
