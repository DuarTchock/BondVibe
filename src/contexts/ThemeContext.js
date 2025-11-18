import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme !== null) {
        setIsDark(savedTheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    try {
      await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const theme = {
    isDark,
    colors: isDark ? {
      // Dark Mode
      background: '#0B0F1A',
      surface: '#111827',
      surfaceElevated: '#1A1F3A',
      surfaceGlass: 'rgba(17, 24, 39, 0.6)',
      
      text: '#F1F5F9',
      textSecondary: '#94A3B8',
      textTertiary: '#64748B',
      
      primary: '#FF3EA5',
      primaryLight: '#FF6BC0',
      primaryDark: '#E6007A',
      
      secondary: '#00F2FE',
      secondaryLight: '#4FFCFF',
      
      accent: '#A6FF96',
      
      success: '#A6FF96',
      successBg: '#1A3C34',
      warning: '#FFA726',
      error: '#FF6B6B',
      
      border: 'rgba(255, 255, 255, 0.08)',
      borderLight: 'rgba(255, 255, 255, 0.05)',
      
      glow: 'rgba(255, 62, 165, 0.4)',
      glowCyan: 'rgba(0, 242, 254, 0.4)',
      shadow: 'rgba(0, 0, 0, 0.5)',
    } : {
      // Light Mode
      background: '#FAFAFC',
      surface: '#FFFFFF',
      surfaceElevated: '#FFFFFF',
      surfaceGlass: 'rgba(255, 255, 255, 0.7)',
      
      text: '#1E293B',
      textSecondary: '#64748B',
      textTertiary: '#94A3B8',
      
      primary: '#FF2E95',
      primaryLight: '#FF5CAA',
      primaryDark: '#E6007A',
      
      secondary: '#00E5FF',
      secondaryLight: '#4FFCFF',
      
      accent: '#8FDB70',
      
      success: '#10B981',
      successBg: '#D1FAE5',
      warning: '#F59E0B',
      error: '#EF4444',
      
      border: 'rgba(0, 0, 0, 0.1)',
      borderLight: 'rgba(0, 0, 0, 0.05)',
      
      glow: 'rgba(255, 46, 149, 0.3)',
      glowCyan: 'rgba(0, 229, 255, 0.3)',
      shadow: 'rgba(0, 0, 0, 0.1)',
    }
  };

  return (
    <ThemeContext.Provider value={{ ...theme, toggleTheme, loading }}>
      {!loading && children}
    </ThemeContext.Provider>
  );
};
