import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { ROOMS } from "./rooms";
import { censor, checkSpam, containsProfanity } from "./moderation";
import { generateAlias, generateSessionId } from "./identity";

export type ChatMessage = {
  id: string;
  room: string;
  session_id: string;
  author_name: string;
  avatar_seed: string;
  content: string;
  created_at: string;
};

export type Reaction = { message_id: string; session_id: string; emoji: string };

export type SystemEvent = { id: string; kind: "join" | "leave"; name: string; at: string };

export type Session = {
  id: string;
  name: string;
  avatarSeed: string;
  renamed: boolean;
};

const STORAGE_KEY = "anon-chat-session";

function loadSession(): Session {
  if (typeof window !== "undefined") {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw) as Session;
      } catch {
        /* regenerate below */
      }
    }
  }
  const id = typeof window === "undefined" ? "server-placeholder-id" : generateSessionId();
  return { id, name: generateAlias(), avatarSeed: id.slice(0, 8), renamed: false };
}

export function useChat() {
  const [session, setSession] = useState<Session | null>(null);
  const [room, setRoom] = useState<string>(ROOMS[0]!.id);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [roomCounts, setRoomCounts] = useState<Record<string, number>>({});
  const [typing, setTyping] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(true);

  const sentAt = useRef<number[]>([]);
  const roomChannel = useRef<RealtimeChannel | null>(null);
  const presenceChannel = useRef<RealtimeChannel | null>(null);
  const typingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const onIncoming = useRef<(m: ChatMessage) => void>(() => {});

  useEffect(() => {
    setSession(loadSession());
  }, []);

  useEffect(() => {
    if (session) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }, [session]);

  const loadReactions = useCallback(async (ids: string[]) => {
    if (!ids.length) return setReactions([]);
    const { data } = await supabase
      .from("message_reactions")
      .select("message_id, session_id, emoji")
      .in("message_id", ids);
    setReactions((data as Reaction[]) ?? []);
  }, []);

  /* Load history for the active room */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setEvents([]);
    (async () => {
      const since = new Date(Date.now() - 24 * 3600_000).toISOString();
      const { data, error: err } = await supabase
        .from("messages")
        .select("*")
        .eq("room", room)
        .gt("created_at", since)
        .order("created_at", { ascending: true })
        .limit(300);
      if (cancelled) return;
      if (err) setError(err.message);
      const rows = (data as ChatMessage[]) ?? [];
      setMessages(rows);
      setLoading(false);
      void loadReactions(rows.map((r) => r.id));
    })();
    return () => {
      cancelled = true;
    };
  }, [room, loadReactions]);

  const messageIds = useMemo(() => messages.map((m) => m.id), [messages]);

  /* Realtime: messages, reactions, typing broadcasts */
  useEffect(() => {
    if (!session) return;
    const channel = supabase
      .channel(`room-${room}`, { config: { broadcast: { self: false } } })
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `room=eq.${room}` },
        (payload) => {
          const msg = payload.new as ChatMessage;
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
          if (msg.session_id !== session.id) onIncoming.current(msg);
        },
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "message_reactions" }, () => {
        setMessages((prev) => {
          void loadReactions(prev.map((m) => m.id));
          return prev;
        });
      })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        const name = (payload as { name?: string })?.name;
        if (!name || name === session.name) return;
        setTyping((prev) => (prev.includes(name) ? prev : [...prev, name]));
        clearTimeout(typingTimers.current[name]);
        typingTimers.current[name] = setTimeout(
          () => setTyping((prev) => prev.filter((n) => n !== name)),
          2600,
        );
      })
      .subscribe((status) => setConnected(status === "SUBSCRIBED"));

    roomChannel.current = channel;
    return () => {
      roomChannel.current = null;
      setTyping([]);
      void supabase.removeChannel(channel);
    };
  }, [room, session, loadReactions]);

  /* Presence: live headcount per room + join/leave announcements */
  useEffect(() => {
    if (!session) return;
    const channel = supabase.channel("chat-lobby", {
      config: { presence: { key: session.id } },
    });

    type Meta = { room: string; name: string };

    const recount = () => {
      const state = channel.presenceState<Meta>();
      const counts: Record<string, number> = {};
      Object.values(state).forEach((entries) => {
        const meta = entries[0];
        if (meta?.room) counts[meta.room] = (counts[meta.room] ?? 0) + 1;
      });
      setRoomCounts(counts);
    };

    channel
      .on("presence", { event: "sync" }, recount)
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        recount();
        const meta = newPresences[0] as unknown as Meta | undefined;
        if (!meta || key === session.id || meta.room !== room) return;
        setEvents((prev) => [
          ...prev,
          { id: `${key}-join-${Date.now()}`, kind: "join", name: meta.name, at: new Date().toISOString() },
        ]);
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        recount();
        const meta = leftPresences[0] as unknown as Meta | undefined;
        if (!meta || key === session.id || meta.room !== room) return;
        setEvents((prev) => [
          ...prev,
          { id: `${key}-leave-${Date.now()}`, kind: "leave", name: meta.name, at: new Date().toISOString() },
        ]);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") await channel.track({ room, name: session.name });
      });

    presenceChannel.current = channel;
    return () => {
      presenceChannel.current = null;
      void supabase.removeChannel(channel);
    };
  }, [session, room]);

  const sendTyping = useCallback(() => {
    if (!session || !roomChannel.current) return;
    void roomChannel.current.send({ type: "broadcast", event: "typing", payload: { name: session.name } });
  }, [session]);

  const sendMessage = useCallback(
    async (raw: string): Promise<{ ok: boolean; reason?: string; censored?: boolean }> => {
      if (!session) return { ok: false, reason: "Still connecting…" };
      const verdict = checkSpam(raw, sentAt.current);
      if (!verdict.ok) return { ok: false, reason: verdict.reason };

      const flagged = containsProfanity(raw);
      const content = censor(raw.trim());
      sentAt.current = [...sentAt.current.filter((t) => Date.now() - t < 5000), Date.now()];

      const { data, error: err } = await supabase
        .from("messages")
        .insert({
          room,
          session_id: session.id,
          author_name: session.name,
          avatar_seed: session.avatarSeed,
          content,
        })
        .select()
        .single();
      if (err) return { ok: false, reason: err.message.replace(/^.*Slow down/, "Slow down") };
      const inserted = data as ChatMessage | null;
      if (inserted) {
        setMessages((prev) => (prev.some((m) => m.id === inserted.id) ? prev : [...prev, inserted]));
      }
      return { ok: true, censored: flagged };
    },
    [room, session],
  );

  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!session) return;
      const mine = reactions.find(
        (r) => r.message_id === messageId && r.emoji === emoji && r.session_id === session.id,
      );
      if (mine) {
        setReactions((prev) => prev.filter((r) => r !== mine));
        await supabase
          .from("message_reactions")
          .delete()
          .eq("message_id", messageId)
          .eq("emoji", emoji)
          .eq("session_id", session.id);
      } else {
        setReactions((prev) => [...prev, { message_id: messageId, session_id: session.id, emoji }]);
        await supabase
          .from("message_reactions")
          .insert({ message_id: messageId, session_id: session.id, emoji });
      }
    },
    [reactions, session],
  );

  const renameSelf = useCallback(
    (name: string) => {
      setSession((prev) => (prev && !prev.renamed ? { ...prev, name, renamed: true } : prev));
      void presenceChannel.current?.track({ room, name });
    },
    [room],
  );

  return {
    session,
    room,
    setRoom,
    messages,
    reactions,
    events,
    roomCounts,
    typing,
    loading,
    connected,
    error,
    soundOn,
    setSoundOn,
    sendMessage,
    sendTyping,
    toggleReaction,
    renameSelf,
    messageIds,
    onIncoming,
  };
}
