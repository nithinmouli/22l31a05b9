import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Tabs, Tab, Paper } from '@mui/material';
import { LinkRounded, BarChartRounded } from '@mui/icons-material';

const Navigation = ({ currentView, onViewChange }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleTabChange = (event, newValue) => {
    onViewChange(newValue);
    navigate(`/${newValue}`);
  };

  const getCurrentTab = () => {
    const path = location.pathname.substring(1);
    return path || 'shortener';
  };

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', backgroundColor: 'background.paper' }}>
      <Paper elevation={0} sx={{ borderRadius: 0 }}>
        <Tabs
          value={getCurrentTab()}
          onChange={handleTabChange}
          centered
          sx={{
            '& .MuiTabs-indicator': {
              height: 3,
            },
          }}
        >
          <Tab
            value="shortener"
            icon={<LinkRounded />}
            label="URL Shortener"
            iconPosition="start"
            sx={{
              minHeight: 72,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500,
              '&.Mui-selected': {
                color: 'primary.main',
              },
            }}
          />
          <Tab
            value="dashboard"
            icon={<BarChartRounded />}
            label="Dashboard"
            iconPosition="start"
            sx={{
              minHeight: 72,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500,
              '&.Mui-selected': {
                color: 'primary.main',
              },
            }}
          />
        </Tabs>
      </Paper>
    </Box>
  );
};

export default Navigation;
