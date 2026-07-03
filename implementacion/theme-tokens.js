// BondVibe — Theme tokens (Warmth = light · Aurora = dark)
// Drop-in replacement for the `colors` object in src/contexts/ThemeContext.js
// Keeps EVERY existing token name (primary, background, text…) so all current
// screens recolor instantly, and ADDS Bold-Pop tokens (borderStrong, hardShadow,
// ink, onInk, onPrimary) used by the new shared components.

export const WARMTH = {
  // surfaces
  background: '#FBF6F1',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceGlass: 'rgba(255, 255, 255, 0.85)',
  // text
  text: '#2A2520',
  textSecondary: '#9A8D7E',
  textTertiary: '#B6A99B',
  // brand accents — Day leans coral + teal
  primary: '#F0573D',
  primaryLight: '#FF7E5F',
  primaryDark: '#C2603F',
  secondary: '#1F8A6E',
  secondaryLight: '#2FA888',
  accent: '#1F8A6E',
  // status
  success: '#1F8A6E',
  successBg: '#DBF0E9',
  warning: '#E8A33D',
  error: '#E0413A',
  // lines
  border: 'rgba(42, 37, 32, 0.10)',
  borderLight: 'rgba(42, 37, 32, 0.06)',
  // Bold Pop additions
  borderStrong: '#2A2520',   // 2px card outline
  hardShadow: '#2A2520',     // offset block shadow
  ink: '#2A2520',            // strong fg (dark tab bar, badges)
  onInk: '#FFFFFF',
  onPrimary: '#FFFFFF',
  // effects
  glow: 'rgba(240, 87, 61, 0.25)',
  glowCyan: 'rgba(31, 138, 110, 0.25)',
  shadow: 'rgba(80, 60, 40, 0.12)',
};

export const AURORA = {
  // surfaces
  background: '#0E1117',
  surface: '#171B26',
  surfaceElevated: '#1C2130',
  surfaceGlass: 'rgba(22, 26, 38, 0.70)',
  // text
  text: '#EDEFF5',
  textSecondary: '#8B93A7',
  textTertiary: '#6B7385',
  // brand accents — Night leans magenta + cyan
  primary: '#FF3E9A',
  primaryLight: '#FF6FB5',
  primaryDark: '#E6007A',
  secondary: '#3DDCFF',
  secondaryLight: '#7DE9FF',
  accent: '#3DDCFF',
  // status
  success: '#3DE0A0',
  successBg: '#0F3A2E',
  warning: '#FFB23D',
  error: '#FF6B6B',
  // lines
  border: 'rgba(255, 255, 255, 0.12)',
  borderLight: 'rgba(255, 255, 255, 0.07)',
  // Bold Pop additions
  borderStrong: 'rgba(255, 255, 255, 0.16)',
  hardShadow: '#FF3E9A',
  ink: '#EDEFF5',
  onInk: '#0E1117',
  onPrimary: '#FFFFFF',
  // effects
  glow: 'rgba(255, 62, 154, 0.45)',
  glowCyan: 'rgba(61, 220, 255, 0.40)',
  shadow: 'rgba(0, 0, 0, 0.50)',
};

// In ThemeContext.js:
//   import { WARMTH, AURORA } from '../constants/theme-tokens';
//   const colors = isDark ? AURORA : WARMTH;
