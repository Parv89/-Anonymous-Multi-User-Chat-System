import { useRef, useState } from "react";
import { Send, Smile, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const LIMIT = 500;
const EMOJIS = ["😂", "🔥", "💀", "🫠", "👀", "🙌", "😭", "✨", "🤝", "🧠", "💬", "🥲", "🚀", "🌙", "🤐", "❤️"];

type Props = {
  disabled: boolean;
  roomLabel: string;
  onSend: (text: string) => Promise<{ ok: boolean; reason?: string; censored?: boolean }>;
  onTyping: () => void;
};

export function MessageInput({ disabled, roomLabel, onSend, onTyping }: Props) {
  const [value, setValue] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const lastTyping = useRef(0);

  const remaining = LIMIT - value.length;
  const pct = Math.min(1, value.length / LIMIT);
  const canSend = value.trim().length > 0 && remaining >= 0 && !sending && !disabled;

  const submit = async () => {
    if (!canSend) return;
    setSending(true);
    const result = await onSend(value);
    setSending(false);
    if (result.ok) {
      setValue("");
      setNotice(result.censored ? "Sent — a few words were filtered out." : null);
      textarea.current?.focus();
    } else {
      setNotice(result.reason ?? "Message rejected.");
    }
    setTimeout(() => setNotice(null), 3200);
  };

  const handleChange = (v: string) => {
    setValue(v.slice(0, LIMIT + 40));
    const now = Date.now();
    if (now - lastTyping.current > 1200) {
      lastTyping.current = now;
      onTyping();
    }
  };

  return (
    <div className="border-t border-border bg-background/80 px-3 py-3 backdrop-blur-xl md:px-6 md:py-4">
      {notice && (
        <p className="rise-in mb-2 flex items-center gap-2 text-[0.7rem] text-destructive">
          <ShieldAlert className="size-3.5" /> {notice}
        </p>
      )}

      {showEmoji && (
        <div className="rise-in mb-2 flex flex-wrap gap-1 rounded-2xl border border-border bg-popover p-2">
          {EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => {
                handleChange(value + e);
                textarea.current?.focus();
              }}
              className="rounded-lg px-1.5 py-1 text-base transition-transform hover:scale-125"
            >
              {e}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 rounded-2xl border border-border bg-surface p-2 focus-within:glow-ring">
        <button
          onClick={() => setShowEmoji((s) => !s)}
          aria-label="Emoji picker"
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors hover:text-foreground",
            showEmoji && "text-signal",
          )}
        >
          <Smile className="size-4" />
        </button>

        <textarea
          ref={textarea}
          rows={1}
          value={value}
          disabled={disabled}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void submit();
            }
          }}
          placeholder={`Message #${roomLabel} — nobody knows it's you`}
          className="scroll-slim max-h-36 min-h-9 flex-1 resize-none bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
        />

        <div className="flex shrink-0 items-center gap-2">
          <div className="relative grid size-9 place-items-center" title={`${remaining} characters left`}>
            <svg viewBox="0 0 36 36" className="size-8 -rotate-90">
              <circle cx="18" cy="18" r="15" fill="none" strokeWidth="3" className="stroke-border" />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={94.2}
                strokeDashoffset={94.2 * (1 - pct)}
                className={cn(
                  "transition-[stroke-dashoffset] duration-200",
                  remaining < 0 ? "stroke-destructive" : remaining < 60 ? "stroke-amber-400" : "stroke-signal",
                )}
              />
            </svg>
            <span
              className={cn(
                "absolute text-[0.55rem] tabular-nums",
                remaining < 0 ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {remaining}
            </span>
          </div>

          <button
            onClick={() => void submit()}
            disabled={!canSend}
            aria-label="Send message"
            className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground transition-opacity disabled:opacity-35"
          >
            <Send className="size-4" />
          </button>
        </div>
      </div>

      <p className="mt-2 px-1 text-[0.62rem] text-muted-foreground">
        Enter to send · Shift+Enter for a new line · messages self-destruct after 24h
      </p>
    </div>
  );
}
