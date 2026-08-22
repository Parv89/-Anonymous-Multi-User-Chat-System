import { Menu, Moon, Sun, Volume2, VolumeX, Users, Lock } from "lucide-react";
import type { Room } from "@/lib/chat/rooms";
import { cn } from "@/lib/utils";

type Props = {
  room: Room;
  online: number;
  connected: boolean;
  theme: "dark" | "light";
  soundOn: boolean;
  onToggleTheme: () => void;
  onToggleSound: () => void;
  onOpenNav: () => void;
};

function IconButton({
  label,
  onClick,
  children,
  active,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "grid size-9 place-items-center rounded-xl border border-border bg-surface text-muted-foreground transition-colors hover:text-foreground",
        active && "text-signal",
      )}
    >
      {children}
    </button>
  );
}

export function ChatHeader({
  room,
  online,
  connected,
  theme,
  soundOn,
  onToggleTheme,
  onToggleSound,
  onOpenNav,
}: Props) {
  const Icon = room.icon;
  return (
    <header className="flex items-center gap-3 border-b border-border bg-background/70 px-4 py-3 backdrop-blur-xl md:px-6">
      <button
        onClick={onOpenNav}
        aria-label="Open rooms"
        className="grid size-9 place-items-center rounded-xl border border-border bg-surface md:hidden"
      >
        <Menu className="size-4" />
      </button>

      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-signal/12">
        <Icon className="size-4 text-signal" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h1 className="truncate font-display text-base font-semibold">#{room.label}</h1>
          <span
            className={cn(
              "hidden items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-[0.62rem] sm:flex",
              connected ? "text-signal" : "text-muted-foreground",
            )}
          >
            <span className={cn("size-1.5 rounded-full", connected ? "bg-signal" : "bg-muted-foreground")} />
            {connected ? "live" : "connecting"}
          </span>
        </div>
        <p className="truncate text-[0.7rem] text-muted-foreground">{room.description}</p>
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden items-center gap-1.5 rounded-xl border border-border bg-surface px-2.5 py-1.5 text-[0.7rem] tabular-nums sm:flex">
          <Users className="size-3.5 text-signal" />
          {online} here
        </span>
        <span className="hidden items-center gap-1.5 rounded-xl border border-border bg-surface px-2.5 py-1.5 text-[0.7rem] lg:flex">
          <Lock className="size-3.5 text-signal" />
          anonymous
        </span>
        <IconButton label={soundOn ? "Mute notifications" : "Unmute notifications"} onClick={onToggleSound} active={soundOn}>
          {soundOn ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
        </IconButton>
        <IconButton label="Toggle theme" onClick={onToggleTheme}>
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </IconButton>
      </div>
    </header>
  );
}
