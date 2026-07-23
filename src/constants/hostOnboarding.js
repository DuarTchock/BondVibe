/**
 * The structured answers a host gives when applying (RequestHostScreen step 1).
 *
 * These replaced three required 500-char essays, which were the flow's biggest
 * drop-off. IDs are stable and stored raw in the `hostRequests` doc — labels are
 * i18n keys resolved at render, so translating never rewrites stored data.
 *
 * Adding an option: append it. Never renumber or reuse an id — old requests
 * carry the old value and admins still read them.
 */

/** What kind of community — required. Order matches the design handoff. */
export const COMMUNITY_TYPES = [
  { id: "yoga", labelKey: "requestHost.communityTypes.yoga" },
  { id: "running", labelKey: "requestHost.communityTypes.running" },
  { id: "salsa", labelKey: "requestHost.communityTypes.salsa" },
  { id: "wellness", labelKey: "requestHost.communityTypes.wellness" },
  { id: "fitness", labelKey: "requestHost.communityTypes.fitness" },
  { id: "art", labelKey: "requestHost.communityTypes.art" },
  { id: "music", labelKey: "requestHost.communityTypes.music" },
  { id: "other", labelKey: "requestHost.communityTypes.other" },
];

/** How often they meet — optional. */
export const MEET_FREQUENCIES = [
  { id: "weekly", labelKey: "requestHost.frequencies.weekly" },
  { id: "multiWeekly", labelKey: "requestHost.frequencies.multiWeekly" },
  { id: "monthly", labelKey: "requestHost.frequencies.monthly" },
  { id: "oneOff", labelKey: "requestHost.frequencies.oneOff" },
];

/** Typical group size — optional. */
export const GROUP_SIZES = [
  { id: "oneOnOne", labelKey: "requestHost.groupSizes.oneOnOne" },
  { id: "small", labelKey: "requestHost.groupSizes.small" },
  { id: "medium", labelKey: "requestHost.groupSizes.medium" },
  { id: "large", labelKey: "requestHost.groupSizes.large" },
];

/** Max length of the one-line tagline (the only free text step 1 asks for). */
export const TAGLINE_MAX = 80;

/** Max length of the optional experience note in step 2. */
export const EXPERIENCE_MAX = 500;

/** Max length of the free-text "Other" community type (revealed by the chip). */
export const COMMUNITY_TYPE_OTHER_MAX = 40;

/** Description (step 2) is now REQUIRED with a minimum, not an optional note. */
export const DESCRIPTION_MIN = 120;
export const DESCRIPTION_MAX = 800;

/** Max attachments a host may add to their application (images only for now). */
export const MAX_HOST_ATTACHMENTS = 4;

/**
 * Resolve `[{id, labelKey}]` into what ChipGroup wants.
 * @param {Array<{id:string,labelKey:string}>} options
 * @param {(k:string)=>string} t
 * @returns {Array<{id:string,label:string}>}
 */
export const toChips = (options, t) =>
  options.map(({ id, labelKey }) => ({ id, label: t(labelKey) }));
