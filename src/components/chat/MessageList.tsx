import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, Timer, SmilePlus } from "lucide-react";
import type { ChatMessage, Reaction, SystemEvent } from "@/lib/chat/useChat";
import { absoluteTime, hoursLeft, relativeTime } from "@/lib/chat/moderation";
import { AnonAvatar } from "./AnonAvatar";
import { cn } from "@/lib/utils";

const QUICK = ["🔥", "😂", "💯", "👀", "🫶", "😮"];

type Props = {
  messages: ChatMessage[];
  events: SystemEvent[];
  reactions: Reaction[];
  sessionId: string | null;
  typing: string[];
  loading: boolean;
  onReact: (messageId: string, emoji: string) => void;
};

type Item =
  | { kind: "message"; at: number; data: ChatMessage }
  | { kind: "event"; at: number; data: SystemEvent };

export function MessageList({ messages, events, reactions, sessionId, typing, loading, onReact }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(true);
  const [unread, setUnread] = useState(0);
  const [picker, setPicker] = useState<string | null>(null);

  const items = useMemo<Item[]>(
    () =>
      [
        ...messages.map((m) => ({ kind: "message" as const, at: new Date(m.created_at).getTime(), data: m })),
        ...events.map((e) => ({ kind: "event" as const, at: new Date(e.at).getTime(), data: e })),
      ].sort((a, b) => a.at - b.at),
    [messages, events],
  );

  const byMessage = useMemo(() => {
    const map = new Map<string, { emoji: string; count: number; mine: boolean }[]>();
    reactions.forEach((r) => {
      const list = map.get(r.message_id) ?? [];
      const found = list.find((x) => x.emoji === r.emoji);
      if (found) {
        found.count += 1;
        found.mine ||= r.session_id === sessionId;
      } else {
        list.push({ emoji: r.emoji, count: 1, mine: r.session_id === sessionId });
      }
      map.set(r.message_id, list);
    });
    return map;
  }, [reactions, sessionId]);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
    setUnread(0);
  };

  useEffect(() => {
    if (pinned) scrollToBottom(items.length > 30 ? "auto" : "smooth");
    else setUnread((n) => n + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  const handleScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 90;
    setPinned(atBottom);
    if (atBottom) setUnread(0);
  };

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        ref={scroller}
        onScroll={handleScroll}
        className="scroll-slim ambient-grid flex h-full flex-col justify-end space-y-1 overflow-y-auto px-3 py-6 md:px-8"
      >
        {loading && <p className="py-10 text-center text-xs text-muted-foreground">Decrypting the last 24 hours…</p>}

        {!loading && !items.length && (
          <div className="mx-auto max-w-sm rounded-2xl border border-border bg-surface p-6 text-center">
            <p className="font-display text-sm">Nothing here yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              This room is empty. Whatever gets said here disappears within 24 hours.
            </p>
          </div>
        )}

        {items.map((item) => {
          if (item.kind === "event") {
            return (
              <div key={item.data.id} className="flex justify-center py-2">
                <span className="rise-in rounded-full border border-border bg-surface px-3 py-1 text-[0.65rem] text-muted-foreground">
                  {item.data.name} {item.data.kind === "join" ? "slipped in" : "vanished"}
                </span>
              </div>
            );
          }

          const m = item.data;
          const self = m.session_id === sessionId;
          const list = byMessage.get(m.id) ?? [];

          return (
            <div
              key={m.id}
              className={cn("rise-in group flex gap-3 py-1.5", self && "flex-row-reverse")}
              onMouseLeave={() => setPicker((p) => (p === m.id ? null : p))}
            >
              <AnonAvatar name={m.author_name} seed={m.avatar_seed} />

              <div className={cn("flex min-w-0 max-w-[min(38rem,82%)] flex-col gap-1", self && "items-end")}>
                <div className={cn("flex items-baseline gap-2 px-1", self && "flex-row-reverse")}>
                  <span className="font-display text-xs font-medium">{self ? "you" : m.author_name}</span>
                  <span className="text-[0.62rem] text-muted-foreground" title={new Date(m.created_at).toLocaleString()}>
                    {relativeTime(m.created_at)} · {absoluteTime(m.created_at)}
                  </span>
                </div>

                <div
                  className={cn(
                    "rounded-2xl border border-border px-3.5 py-2.5 text-sm leading-relaxed break-words whitespace-pre-wrap",
                    self
                      ? "rounded-tr-sm bg-bubble-self text-bubble-self-foreground"
                      : "rounded-tl-sm bg-bubble text-bubble-foreground",
                  )}
                >
                  {m.content}
                </div>

                <div className={cn("flex flex-wrap items-center gap-1.5 px-1", self && "justify-end")}>
                  {list.map((r) => (
                    <button
                      key={r.emoji}
                      onClick={() => onReact(m.id, r.emoji)}
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[0.7rem] transition-colors",
                        r.mine
                          ? "border-signal/50 bg-signal/12 text-signal"
                          : "border-border bg-surface text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {r.emoji} {r.count}
                    </button>
                  ))}

                  <button
                    onClick={() => setPicker((p) => (p === m.id ? null : m.id))}
                    aria-label="Add reaction"
                    className="rounded-full border border-border bg-surface p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                  >
                    <SmilePlus className="size-3" />
                  </button>

                  {picker === m.id && (
                    <div className="rise-in flex items-center gap-0.5 rounded-full border border-border bg-popover px-1.5 py-1 glow-ring">
                      {QUICK.map((e) => (
                        <button
                          key={e}
                          onClick={() => {
                            onReact(m.id, e);
                            setPicker(null);
                          }}
                          className="rounded-full px-1 text-sm transition-transform hover:scale-125"
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  )}

                  <span className="hidden items-center gap-1 text-[0.6rem] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 sm:flex">
                    <Timer className="size-3" /> self-destructs in {hoursLeft(m.created_at)}h
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {typing.length > 0 && (
          <div className="flex items-center gap-2 px-1 py-2 text-[0.7rem] text-muted-foreground">
            <span className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="typing-dot size-1.5 rounded-full bg-signal"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </span>
            {typing.slice(0, 2).join(", ")}
            {typing.length > 2 ? ` +${typing.length - 2} more` : ""} typing…
          </div>
        )}
      </div>

      {!pinned && (
        <button
          onClick={() => scrollToBottom()}
          className="rise-in absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-popover px-3.5 py-2 text-xs glow-ring"
        >
          <ArrowDown className="size-3.5 text-signal" />
          {unread > 0 ? `${unread} new message${unread > 1 ? "s" : ""} below` : "Jump to latest"}
        </button>
      )}
    </div>
  );
}
