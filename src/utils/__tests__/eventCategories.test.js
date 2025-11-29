import { EVENT_CATEGORIES, normalizeCategory, isValidCategory } from '../eventCategories';

describe('eventCategories', () => {
  describe('EVENT_CATEGORIES', () => {
    it('should contain all expected categories', () => {
      expect(EVENT_CATEGORIES).toEqual([
        'Social',
        'Sports',
        'Food',
        'Arts',
        'Learning',
        'Adventure'
      ]);
    });

    it('should have 6 categories', () => {
      expect(EVENT_CATEGORIES).toHaveLength(6);
    });
  });

  describe('normalizeCategory', () => {
    it('should normalize lowercase to capitalized', () => {
      expect(normalizeCategory('social')).toBe('Social');
      expect(normalizeCategory('sports')).toBe('Sports');
      expect(normalizeCategory('food')).toBe('Food');
    });

    it('should handle "Food & Drink" variations', () => {
      expect(normalizeCategory('Food & Drink')).toBe('Food');
      expect(normalizeCategory('food & drink')).toBe('Food');
      expect(normalizeCategory('food and drink')).toBe('Food');
    });

    it('should handle singular/plural variations', () => {
      expect(normalizeCategory('sport')).toBe('Sports');
      expect(normalizeCategory('art')).toBe('Arts');
      expect(normalizeCategory('adventures')).toBe('Adventure');
    });

    it('should handle education as Learning', () => {
      expect(normalizeCategory('education')).toBe('Learning');
      expect(normalizeCategory('Education')).toBe('Learning');
    });

    it('should trim whitespace', () => {
      expect(normalizeCategory('  social  ')).toBe('Social');
    });

    it('should return null for null/undefined', () => {
      expect(normalizeCategory(null)).toBe(null);
      expect(normalizeCategory(undefined)).toBe(null);
      expect(normalizeCategory('')).toBe(null);
    });

    it('should return original value for unknown categories', () => {
      expect(normalizeCategory('Unknown')).toBe('Unknown');
    });
  });

  describe('isValidCategory', () => {
    it('should return true for valid categories', () => {
      expect(isValidCategory('Social')).toBe(true);
      expect(isValidCategory('Sports')).toBe(true);
      expect(isValidCategory('Food')).toBe(true);
    });

    it('should return false for invalid categories', () => {
      expect(isValidCategory('social')).toBe(false); // lowercase
      expect(isValidCategory('Unknown')).toBe(false);
      expect(isValidCategory(null)).toBe(false);
    });
  });
});
