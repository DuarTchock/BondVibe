// Event categories used throughout the app
// IMPORTANT: This file maintains backwards compatibility

// Main category export - array of objects with full information
export const EVENT_CATEGORIES = [
  { id: "social", emoji: "🎉", label: "Social" },
  { id: "sports", emoji: "⚽", label: "Sports" },
  { id: "food", emoji: "🍕", label: "Food" },
  { id: "arts", emoji: "🎨", label: "Arts" },
  { id: "learning", emoji: "📚", label: "Learning" },
  { id: "adventure", emoji: "🏔️", label: "Adventure" },
];

// Simple string array for backwards compatibility
// Use this in components that expect simple strings
export const CATEGORY_NAMES = EVENT_CATEGORIES.map((cat) => cat.label);

// Legacy export - maintains old behavior
// This ensures old code doesn't break
export const CATEGORIES = CATEGORY_NAMES;

// Helper function to normalize category strings
export const normalizeCategory = (category) => {
  if (!category) return null;

  const normalized = category.toLowerCase().trim();

  // Map common variations to standard categories
  const categoryMap = {
    social: "social",
    sports: "sports",
    sport: "sports",
    food: "food",
    "food & drink": "food",
    "food and drink": "food",
    arts: "arts",
    art: "arts",
    learning: "learning",
    education: "learning",
    adventure: "adventure",
    adventures: "adventure",
  };

  return categoryMap[normalized] || normalized;
};

// Helper to validate if a category is valid
export const isValidCategory = (category) => {
  const categoryIds = EVENT_CATEGORIES.map((cat) => cat.id);
  const lowerCategory = category?.toLowerCase();
  return (
    categoryIds.includes(lowerCategory) || CATEGORY_NAMES.includes(category)
  );
};

// Get category object by id or label
export const getCategoryById = (id) => {
  const lowerId = id?.toLowerCase();
  return EVENT_CATEGORIES.find((cat) => cat.id === lowerId || cat.label === id);
};

// Get category emoji by id or label
export const getCategoryEmoji = (id) => {
  const category = getCategoryById(id);
  return category?.emoji || "🎉";
};

// Get category label by id
export const getCategoryLabel = (id) => {
  const category = getCategoryById(id);
  return category?.label || id;
};

// Get category ID from label
export const getCategoryId = (label) => {
  const category = EVENT_CATEGORIES.find((cat) => cat.label === label);
  return category?.id || label?.toLowerCase();
};
