// Legacy flat palette — kept for the few screens that import it directly.
// Derived from the single source of truth (theme-tokens) so there are no
// duplicate hardcoded palettes. Uses the Warmth (day) accents.
import { WARMTH } from './theme-tokens';

export default {
  primary: WARMTH.primary,
  secondary: WARMTH.secondary,
  background: WARMTH.background,
  text: WARMTH.text,
  textLight: WARMTH.textSecondary,
  border: WARMTH.border,
  error: WARMTH.error,
  success: WARMTH.success,
};
