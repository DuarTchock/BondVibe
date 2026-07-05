/**
 * useClaude — React hook over claudeService for non-chat AI features.
 *
 *   const { data, loading, error, fallback, needsPlus, refresh } =
 *     useClaude("smart_wall", {}, { enabled: aiOptIn, cacheKey: "wall", ttlMs: 90*60*1000 });
 *
 * `enabled:false` (e.g. AI not opted in) short-circuits to fallback without
 * a network call, so screens render their plain version immediately.
 */
import { useState, useEffect, useCallback } from "react";
import { callClaude, invalidateClaudeCache } from "../services/claudeService";

export default function useClaude(feature, input = {}, opts = {}) {
  const { enabled = true, cacheKey, ttlMs } = opts;
  const [state, setState] = useState({
    data: null,
    loading: enabled,
    error: null,
    fallback: !enabled,
    needsPlus: false,
  });

  const run = useCallback(async () => {
    if (!enabled) {
      setState({ data: null, loading: false, error: null, fallback: true, needsPlus: false });
      return;
    }
    setState((s) => ({ ...s, loading: true }));
    const res = await callClaude(feature, input, { cacheKey, ttlMs });
    if (res.ok) {
      setState({ data: res.data, loading: false, error: null, fallback: false, needsPlus: false });
    } else {
      setState({
        data: null,
        loading: false,
        error: res.error || "ai_unavailable",
        fallback: true,
        needsPlus: res.needsPlus === true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feature, enabled, cacheKey, ttlMs, JSON.stringify(input)]);

  useEffect(() => {
    run();
  }, [run]);

  const refresh = useCallback(() => {
    if (cacheKey) invalidateClaudeCache(cacheKey);
    run();
  }, [cacheKey, run]);

  return { ...state, refresh };
}
