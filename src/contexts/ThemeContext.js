import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WARMTH, AURORA } from '../constants/theme-tokens';

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

  // Warmth = day, Aurora = night. Single source of truth in
  // src/constants/theme-tokens.js (keeps every existing token name + adds the
  // Bold-Pop tokens), so screens recolor instantly on toggle.
  const colors = isDark ? AURORA : WARMTH;

  const theme = {
    isDark,
    colors,
  };

  return (
    <ThemeContext.Provider value={{ ...theme, toggleTheme, loading }}>
      {!loading && children}
    </ThemeContext.Provider>
  );
};
