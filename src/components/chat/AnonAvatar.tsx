import { avatarGradient, initials } from "@/lib/chat/identity";
import { cn } from "@/lib/utils";

export function AnonAvatar({
  name,
  seed,
  size = 36,
  className,
}: {
  name: string;
  seed: string;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl font-display font-semibold text-[0.7rem] text-black/80 select-none",
        className,
      )}
      style={{ width: size, height: size, background: avatarGradient(seed || name) }}
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}
