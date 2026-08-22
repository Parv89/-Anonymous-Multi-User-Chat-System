import { Hash, Ghost, LifeBuoy, Shuffle, Cpu, type LucideIcon } from "lucide-react";

export type Room = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const ROOMS: Room[] = [
  {
    id: "general",
    label: "general",
    description: "Open floor. Say anything, stay nobody.",
    icon: Hash,
  },
  {
    id: "confessions",
    label: "confessions",
    description: "Things you'd never sign your name to.",
    icon: Ghost,
  },
  {
    id: "advice",
    label: "advice",
    description: "Ask strangers. Strangers are honest.",
    icon: LifeBuoy,
  },
  {
    id: "random",
    label: "random",
    description: "No topic, no rules, no history.",
    icon: Shuffle,
  },
  {
    id: "tech-talk",
    label: "tech-talk",
    description: "Builds, bugs, and hot takes.",
    icon: Cpu,
  },
];

export const getRoom = (id: string): Room => ROOMS.find((r) => r.id === id) ?? ROOMS[0];
