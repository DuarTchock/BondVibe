/**
 * Event Date Filtering Utilities
 * Helper functions to filter events by date (past, today, upcoming)
 */

/**
 * Check if an event date is in the past
 * @param {string} eventDate - ISO date string (e.g., "2025-12-01")
 * @returns {boolean}
 */
export const isEventPast = (eventDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const event = new Date(eventDate);
  event.setHours(0, 0, 0, 0);

  return event < today;
};

/**
 * Check if an event date is today
 * @param {string} eventDate - ISO date string
 * @returns {boolean}
 */
export const isEventToday = (eventDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const event = new Date(eventDate);
  event.setHours(0, 0, 0, 0);

  return event.getTime() === today.getTime();
};

/**
 * Check if an event date is upcoming (today or future)
 * @param {string} eventDate - ISO date string
 * @returns {boolean}
 */
export const isEventUpcoming = (eventDate) => {
  return !isEventPast(eventDate);
};

/**
 * Filter events array to only include upcoming events
 * @param {Array} events - Array of event objects
 * @returns {Array}
 */
export const filterUpcomingEvents = (events) => {
  return events.filter((event) => isEventUpcoming(event.date));
};

/**
 * Filter events array to only include past events
 * @param {Array} events - Array of event objects
 * @returns {Array}
 */
export const filterPastEvents = (events) => {
  return events.filter((event) => isEventPast(event.date));
};

/**
 * Sort events by date (ascending - soonest first)
 * @param {Array} events - Array of event objects
 * @returns {Array}
 */
export const sortEventsByDate = (events) => {
  return [...events].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA - dateB;
  });
};
