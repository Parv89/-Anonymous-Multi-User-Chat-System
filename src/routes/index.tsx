import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useChat } from "@/lib/chat/useChat";
import { getRoom } from "@/lib/chat/rooms";
import { playBlip } from "@/lib/chat/sound";
import { Sidebar } from "@/components/chat/Sidebar";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageList } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";
import { NameChangeModal } from "@/components/chat/NameChangeModal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nowhere — Anonymous Chat Rooms That Delete Themselves" },
      {
        name: "description",
        content:
          "Join anonymous, no-login chat rooms with a random alias. Live presence, typing indicators, reactions, and every message erased after 24 hours.",
      },
      { property: "og:title", content: "Nowhere — Anonymous Chat Rooms" },
      {
        property: "og:description",
        content:
          "Zero-login anonymous chat. Random alias, themed rooms, real-time presence, and messages that self-destruct in 24 hours.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChatApp,
});

function ChatApp() {
  const chat = useChat();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [navOpen, setNavOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("light", theme === "light");
    root.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    chat.onIncoming.current = () => {
      if (chat.soundOn) playBlip("in");
    };
  }, [chat.onIncoming, chat.soundOn]);

  const room = getRoom(chat.room);

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background">
      <div className="hidden w-72 shrink-0 border-r border-border md:block">
        <Sidebar
          active={chat.room}
          counts={chat.roomCounts}
          session={chat.session}
          onSelect={chat.setRoom}
          onRename={() => setRenameOpen(true)}
        />
      </div>

      {navOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            aria-label="Close rooms"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setNavOpen(false)}
          />
          <div className="rise-in absolute inset-y-0 left-0 w-72 border-r border-border shadow-2xl">
            <button
              onClick={() => setNavOpen(false)}
              aria-label="Close rooms"
              className="absolute top-4 right-3 z-10 grid size-8 place-items-center rounded-lg text-muted-foreground"
            >
              <X className="size-4" />
            </button>
            <Sidebar
              active={chat.room}
              counts={chat.roomCounts}
              session={chat.session}
              onSelect={(r) => {
                chat.setRoom(r);
                setNavOpen(false);
              }}
              onRename={() => {
                setNavOpen(false);
                setRenameOpen(true);
              }}
            />
          </div>
        </div>
      )}

      <main className="flex min-w-0 flex-1 flex-col">
        <ChatHeader
          room={room}
          online={chat.roomCounts[chat.room] ?? 0}
          connected={chat.connected}
          theme={theme}
          soundOn={chat.soundOn}
          onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          onToggleSound={() => chat.setSoundOn((s) => !s)}
          onOpenNav={() => setNavOpen(true)}
        />

        <MessageList
          messages={chat.messages}
          events={chat.events}
          reactions={chat.reactions}
          sessionId={chat.session?.id ?? null}
          typing={chat.typing}
          loading={chat.loading}
          onReact={chat.toggleReaction}
        />

        <MessageInput
          disabled={!chat.session}
          roomLabel={room.label}
          onSend={async (text) => {
            const res = await chat.sendMessage(text);
            if (res.ok && chat.soundOn) playBlip("out");
            return res;
          }}
          onTyping={chat.sendTyping}
        />
      </main>

      <NameChangeModal
        open={renameOpen}
        currentName={chat.session?.name ?? ""}
        seed={chat.session?.avatarSeed ?? ""}
        onClose={() => setRenameOpen(false)}
        onConfirm={chat.renameSelf}
      />
    </div>
  );
}
