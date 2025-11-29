// Event categories used throughout the app
export const EVENT_CATEGORIES = [
  "Social",
  "Sports",
  "Food",
  "Arts",
  "Learning",
  "Adventure",
];

// Helper function to normalize category strings
export const normalizeCategory = (category) => {
  if (!category) return null;

  const normalized = category.toLowerCase().trim();

  // Map common variations to standard categories
  const categoryMap = {
    social: "Social",
    sports: "Sports",
    sport: "Sports",
    food: "Food",
    "food & drink": "Food",
    "food and drink": "Food",
    arts: "Arts",
    art: "Arts",
    learning: "Learning",
    education: "Learning",
    adventure: "Adventure",
    adventures: "Adventure",
  };

  return categoryMap[normalized] || category;
};

// Helper to validate if a category is valid
export const isValidCategory = (category) => {
  return EVENT_CATEGORIES.includes(category);
};
