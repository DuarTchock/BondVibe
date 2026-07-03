import { useState, useEffect } from "react";
import { getMatchingState, msUntilOpen } from "../services/matchingService";

/**
 * Live Community Matching window state for an event.
 *
 * Recomputes disabled → enabled_locked → open → closed from the event's
 * resolved timestamps, and ticks once per second while the window is still
 * locked so the B2 countdown updates and the grid unlocks the moment it opens.
 *
 * @param {object} event event doc (with `matching`)
 * @return {{state:string, msUntilOpen:number, isOpen:boolean,
 *           isLocked:boolean, isClosed:boolean, enabled:boolean}}
 */
export const useMatchingWindow = (event) => {
  const [now, setNow] = useState(() => Date.now());
  const state = getMatchingState(event, now);

  useEffect(() => {
    // Only need a ticking clock while counting down to the open time.
    if (state !== "enabled_locked") return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [state]);

  return {
    state,
    msUntilOpen: msUntilOpen(event, now),
    isOpen: state === "open",
    isLocked: state === "enabled_locked",
    isClosed: state === "closed",
    enabled: state !== "disabled",
  };
};
