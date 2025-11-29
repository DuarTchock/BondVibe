import { formatISODate, formatEventTime } from '../dateUtils';

describe('dateUtils', () => {
  describe('formatISODate', () => {
    it('should format ISO date string correctly', () => {
      const result = formatISODate('2025-11-29T03:00:00.000Z');
      expect(result).toMatch(/Nov 2[89], 2025/); // Timezone dependent
    });

    it('should return "TBD" for null date', () => {
      expect(formatISODate(null)).toBe('TBD');
    });

    it('should return "TBD" for undefined date', () => {
      expect(formatISODate(undefined)).toBe('TBD');
    });

    it('should handle Date objects', () => {
      const date = new Date('2025-12-25T12:00:00.000Z');
      const result = formatISODate(date);
      expect(result).toMatch(/Dec 25, 2025/);
    });

    it('should return "TBD" for invalid date', () => {
      expect(formatISODate('invalid-date')).toBe('TBD');
    });
  });

  describe('formatEventTime', () => {
    it('should return explicit time if provided', () => {
      const result = formatEventTime('2025-11-29T03:00:00.000Z', '7:00 PM');
      expect(result).toBe('7:00 PM');
    });

    it('should extract time from ISO date', () => {
      const result = formatEventTime('2025-11-29T15:30:00.000Z');
      expect(result).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/);
    });

    it('should return empty string for null date', () => {
      expect(formatEventTime(null)).toBe('');
    });

    it('should return empty string for invalid date', () => {
      expect(formatEventTime('invalid-date')).toBe('');
    });
  });
});
