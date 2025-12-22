/**
 * Theme Context Provider
 * Manages hotel-specific branding and theme customization
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import apiClient from '../services/api.service';

const ThemeContext = createContext();

// Default theme colors
const defaultTheme = {
  primaryColor: '#3B5787',
  secondaryColor: '#67BAE0',
  sidebarColor: '#1F2937',
  sidebarTextColor: '#FFFFFF',
  headerColor: '#FFFFFF',
  backgroundColor: '#F8FAFC',
  accentColor: '#10B981',
  logo: null
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(defaultTheme);
  const [isLoading, setIsLoading] = useState(true);
  const user = useSelector(state => state.auth.user);
  const userRole = user?.role;

  // Fetch hotel branding settings
  const fetchBranding = async () => {
    try {
      // Only fetch branding for hotel admins
      if (userRole !== 'hotel') {
        setTheme(defaultTheme);
        setIsLoading(false);
        return;
      }

      const response = await apiClient.get('/hotel/branding');
      const branding = response.data.data.branding;

      if (branding && Object.keys(branding).length > 0) {
        setTheme({
          ...defaultTheme,
          ...branding
        });
      }
    } catch (error) {
      console.error('Error fetching branding:', error);
      setTheme(defaultTheme);
    } finally {
      setIsLoading(false);
    }
  };

  // Update branding settings
  const updateBranding = async (newBranding) => {
    try {
      const response = await apiClient.patch('/hotel/branding', newBranding);
      const updatedBranding = response.data.data.branding;

      setTheme({
        ...defaultTheme,
        ...updatedBranding
      });

      // Apply CSS variables immediately
      applyThemeToDOM({
        ...defaultTheme,
        ...updatedBranding
      });

      return { success: true, data: updatedBranding };
    } catch (error) {
      console.error('Error updating branding:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update branding'
      };
    }
  };

  // Reset to default theme
  const resetTheme = () => {
    setTheme(defaultTheme);
    applyThemeToDOM(defaultTheme);
  };

  // Apply theme to DOM using CSS variables
  const applyThemeToDOM = (themeColors) => {
    const root = document.documentElement;

    root.style.setProperty('--color-primary', themeColors.primaryColor);
    root.style.setProperty('--color-secondary', themeColors.secondaryColor);
    root.style.setProperty('--color-sidebar', themeColors.sidebarColor);
    root.style.setProperty('--color-sidebar-text', themeColors.sidebarTextColor);
    root.style.setProperty('--color-header', themeColors.headerColor);
    root.style.setProperty('--color-background', themeColors.backgroundColor);
    root.style.setProperty('--color-accent', themeColors.accentColor);

    // Calculate lighter and darker shades for hover states
    root.style.setProperty('--color-primary-hover', adjustColor(themeColors.primaryColor, -20));
    root.style.setProperty('--color-secondary-hover', adjustColor(themeColors.secondaryColor, -20));
    root.style.setProperty('--color-sidebar-hover', adjustColor(themeColors.sidebarColor, 10));
  };

  // Helper function to adjust color brightness
  const adjustColor = (color, amount) => {
    const usePound = color[0] === '#';
    const col = usePound ? color.slice(1) : color;
    const num = parseInt(col, 16);

    let r = (num >> 16) + amount;
    let g = ((num >> 8) & 0x00FF) + amount;
    let b = (num & 0x0000FF) + amount;

    r = Math.max(Math.min(255, r), 0);
    g = Math.max(Math.min(255, g), 0);
    b = Math.max(Math.min(255, b), 0);

    return (usePound ? '#' : '') + (
      (r << 16) | (g << 8) | b
    ).toString(16).padStart(6, '0');
  };

  // Fetch branding on mount and when user role changes
  useEffect(() => {
    fetchBranding();
  }, [userRole]);

  // Apply theme whenever it changes
  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  const value = {
    theme,
    isLoading,
    updateBranding,
    resetTheme,
    fetchBranding
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export default ThemeContext;
