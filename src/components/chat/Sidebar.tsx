import { useState } from "react";
import { EyeOff, Search, ShieldCheck, PencilLine, Timer } from "lucide-react";
import { ROOMS } from "@/lib/chat/rooms";
import type { Session } from "@/lib/chat/useChat";
import { AnonAvatar } from "./AnonAvatar";
import { cn } from "@/lib/utils";

type Props = {
  active: string;
  counts: Record<string, number>;
  session: Session | null;
  onSelect: (room: string) => void;
  onRename: () => void;
};

export function Sidebar({ active, counts, session, onSelect, onRename }: Props) {
  const [query, setQuery] = useState("");
  const filtered = ROOMS.filter((r) => r.label.includes(query.trim().toLowerCase()));

  return (
    <aside className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2.5 border-b border-sidebar-border px-5 py-4">
        <div className="grid size-9 place-items-center rounded-xl bg-signal/15 glow-ring">
          <EyeOff className="size-4 text-signal" />
        </div>
        <div className="leading-tight">
          <p className="font-display text-sm font-semibold">Nowhere</p>
          <p className="text-[0.68rem] text-muted-foreground">anonymous rooms</p>
        </div>
      </div>

      <div className="px-4 pt-4">
        <div className="flex items-center gap-2 rounded-xl border border-sidebar-border bg-surface px-3 py-2">
          <Search className="size-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search rooms"
            className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            aria-label="Search rooms"
          />
        </div>
      </div>

      <nav className="scroll-slim mt-3 flex-1 space-y-1 overflow-y-auto px-3 pb-3">
        {filtered.map((r) => {
          const Icon = r.icon;
          const isActive = r.id === active;
          const online = counts[r.id] ?? 0;
          return (
            <button
              key={r.id}
              onClick={() => onSelect(r.id)}
              className={cn(
                "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                isActive
                  ? "bg-sidebar-accent text-foreground glow-ring"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
              )}
            >
              <Icon className={cn("size-4", isActive && "text-signal")} />
              <span className="flex-1 truncate font-display text-sm">{r.label}</span>
              <span
                className={cn(
                  "flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] tabular-nums",
                  online > 0 ? "bg-signal/12 text-signal" : "bg-surface text-muted-foreground",
                )}
              >
                <span className={cn("size-1.5 rounded-full", online > 0 ? "bg-signal" : "bg-muted-foreground/60")} />
                {online}
              </span>
            </button>
          );
        })}
        {!filtered.length && (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">No rooms match that.</p>
        )}
      </nav>

      <div className="space-y-3 border-t border-sidebar-border p-4">
        <div className="rounded-xl border border-sidebar-border bg-surface p-3">
          <div className="flex items-center gap-3">
            <AnonAvatar name={session?.name ?? "??"} seed={session?.avatarSeed ?? "seed"} size={38} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-sm">{session?.name ?? "connecting…"}</p>
              <p className="text-[0.65rem] text-muted-foreground">
                {session?.renamed ? "name locked for this session" : "1 rename available"}
              </p>
            </div>
            <button
              onClick={onRename}
              disabled={!session || session.renamed}
              className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="Change display name"
            >
              <PencilLine className="size-3.5" />
            </button>
          </div>
        </div>

        <div className="space-y-1.5 text-[0.66rem] text-muted-foreground">
          <p className="flex items-center gap-2">
            <ShieldCheck className="size-3.5 text-signal" /> No account, no email, no tracking
          </p>
          <p className="flex items-center gap-2">
            <Timer className="size-3.5 text-signal" /> Everything erased after 24 hours
          </p>
        </div>
      </div>
    </aside>
  );
}
