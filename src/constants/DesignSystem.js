// BondVibe Design System 2025-2026
// Ultra-modern palette with Magenta + Cyan

export const Colors = {
  // Dark Mode (Primary)
  dark: {
    // Backgrounds
    background: '#0B0F1A',        // Deep Cosmos
    surface: '#111827',           // Midnight Glass
    surfaceElevated: '#1A1F3A',
    surfaceGlass: 'rgba(17, 24, 39, 0.6)',
    
    // Text
    text: '#F1F5F9',              // Soft Cloud
    textSecondary: '#94A3B8',     // Slate Mist
    textTertiary: '#64748B',
    
    // Accents - NEW VIBRANT PALETTE
    primary: '#FF3EA5',           // Electric Magenta ⚡
    primaryLight: '#FF6BC0',
    primaryDark: '#E6007A',
    
    secondary: '#00F2FE',         // Cyan Glow 🌊
    secondaryLight: '#4FFCFF',
    secondaryDark: '#00D4E0',
    
    accent: '#A6FF96',            // Lime Pop ✨
    
    // Gradients
    gradientPrimary: ['#FF3EA5', '#00F2FE'],  // Cosmic Sunset
    gradientHero: ['#FF3EA5', '#8B5CF6', '#00F2FE'],
    
    // Status
    success: '#A6FF96',
    successBg: '#1A3C34',         // Emerald Night
    warning: '#FFA726',
    error: '#FF6B6B',             // Coral Alert
    
    // UI Elements
    border: 'rgba(255, 255, 255, 0.1)',
    borderLight: 'rgba(255, 255, 255, 0.05)',
    
    // Effects
    glow: 'rgba(255, 62, 165, 0.4)',
    glowCyan: 'rgba(0, 242, 254, 0.4)',
    shadow: 'rgba(0, 0, 0, 0.5)',
  },
  
  // Light Mode
  light: {
    background: '#FAFAFC',        // Porcelain
    surface: '#FFFFFF',           // Pure White
    surfaceElevated: '#FFFFFF',
    surfaceGlass: 'rgba(255, 255, 255, 0.7)',
    
    text: '#1E293B',              // Slate Night
    textSecondary: '#64748B',
    textTertiary: '#94A3B8',
    
    primary: '#FF2E95',           // Hot Magenta
    primaryLight: '#FF5CAA',
    primaryDark: '#E6007A',
    
    secondary: '#00E5FF',         // Sky Cyan
    secondaryLight: '#4FFCFF',
    
    accent: '#8FDB70',
    
    gradientPrimary: ['#FF2E95', '#00E5FF'],  // Miami Vice 2025
    
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

// Simple shadow presets (sin shadowColor para compatibilidad web)
export const Shadows = {
  sm: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
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
