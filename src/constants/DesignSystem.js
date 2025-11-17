// BondVibe Design System 2025
export const Colors = {
  // Dark Mode (Primary)
  dark: {
    background: '#0A0E27',
    surface: '#131829',
    surfaceElevated: '#1A1F3A',
    surfaceGlass: 'rgba(26, 31, 58, 0.7)',
    
    text: '#FFFFFF',
    textSecondary: '#A0AEC0',
    textTertiary: '#718096',
    
    primary: '#6366F1', // Indigo
    primaryLight: '#818CF8',
    primaryDark: '#4F46E5',
    primaryGradient: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
    
    secondary: '#EC4899', // Pink
    secondaryLight: '#F472B6',
    
    accent: '#06B6D4', // Cyan
    accentGradient: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
    
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    
    border: 'rgba(255, 255, 255, 0.1)',
    borderLight: 'rgba(255, 255, 255, 0.05)',
    
    glow: 'rgba(99, 102, 241, 0.3)',
    shadow: 'rgba(0, 0, 0, 0.5)',
  },
  
  // Light Mode
  light: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfaceGlass: 'rgba(255, 255, 255, 0.7)',
    
    text: '#1E293B',
    textSecondary: '#64748B',
    textTertiary: '#94A3B8',
    
    primary: '#6366F1',
    primaryLight: '#818CF8',
    primaryDark: '#4F46E5',
    primaryGradient: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
    
    secondary: '#EC4899',
    secondaryLight: '#F472B6',
    
    accent: '#06B6D4',
    accentGradient: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
    
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    
    border: 'rgba(0, 0, 0, 0.1)',
    borderLight: 'rgba(0, 0, 0, 0.05)',
    
    glow: 'rgba(99, 102, 241, 0.2)',
    shadow: 'rgba(0, 0, 0, 0.1)',
  }
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  glow: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const Radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  full: 9999,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  h2: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 36,
  },
  h3: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.2,
    lineHeight: 32,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  small: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
};

export const Animations = {
  fast: 150,
  normal: 250,
  slow: 350,
  verySlow: 500,
};
