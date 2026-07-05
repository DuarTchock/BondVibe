/**
 * useKinloChat — Ask Kinlo conversation state. Each send() calls the
 * `ask_kinlo` feature through the AI gateway; replies carry grounded
 * event attachments + suggestion chips. History persists per user in
 * AsyncStorage so the pinned thread survives relaunch.
 *
 * v1 is request/response (no token streaming): the UI shows a typing
 * indicator while waiting. SSE streaming is a later hardening step.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "../services/firebase";
import { callClaude } from "../services/claudeService";

const keyFor = (uid) => `kinlo.askKinlo.history.${uid}`;
const MAX_HISTORY = 40;

export default function useKinloChat() {
  const uid = auth.currentUser?.uid;
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [tasteLimit, setTasteLimit] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!uid || loadedRef.current) return;
    loadedRef.current = true;
    AsyncStorage.getItem(keyFor(uid))
      .then((raw) => raw && setMessages(JSON.parse(raw)))
      .catch(() => {});
  }, [uid]);

  const persist = useCallback(
    (msgs) => {
      if (!uid) return;
      AsyncStorage.setItem(keyFor(uid), JSON.stringify(msgs.slice(-MAX_HISTORY))).catch(() => {});
    },
    [uid]
  );

  const send = useCallback(
    async (text) => {
      const question = (text || "").trim();
      if (!question || sending) return;
      const userMsg = { id: `u${Date.now()}`, role: "user", text: question };
      setMessages((prev) => {
        const next = [...prev, userMsg];
        persist(next);
        return next;
      });
      setSending(true);
      const res = await callClaude("ask_kinlo", { question });
      let aiMsg;
      if (res.ok) {
        aiMsg = {
          id: `a${Date.now()}`,
          role: "assistant",
          text: res.data.reply,
          attachments: res.data.attachments || [],
          suggestions: res.data.suggestions || [],
        };
      } else if (res.needsPlus) {
        setTasteLimit(true);
        aiMsg = {
          id: `a${Date.now()}`,
          role: "assistant",
          text: "You've used your free questions for this week. Upgrade to Kinlo Plus for unlimited Ask Kinlo.",
          needsPlus: true,
        };
      } else {
        aiMsg = {
          id: `a${Date.now()}`,
          role: "assistant",
          text: "Kinlo AI is taking a break — please try again in a moment.",
          fallback: true,
        };
      }
      setMessages((prev) => {
        const next = [...prev, aiMsg];
        persist(next);
        return next;
      });
      setSending(false);
    },
    [sending, persist]
  );

  return { messages, send, sending, tasteLimit };
}
