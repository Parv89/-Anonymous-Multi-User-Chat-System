import { useEffect, useState } from "react";
import { AlertTriangle, Dices, X } from "lucide-react";
import { generateAlias } from "@/lib/chat/identity";
import { containsProfanity } from "@/lib/chat/moderation";
import { AnonAvatar } from "./AnonAvatar";

type Props = {
  open: boolean;
  currentName: string;
  seed: string;
  onClose: () => void;
  onConfirm: (name: string) => void;
};

export function NameChangeModal({ open, currentName, seed, onClose, onConfirm }: Props) {
  const [value, setValue] = useState(currentName);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValue(currentName);
      setError(null);
    }
  }, [open, currentName]);

  if (!open) return null;

  const confirm = () => {
    const name = value.trim();
    if (name.length < 2 || name.length > 24) return setError("Pick 2–24 characters.");
    if (!/^[A-Za-z0-9_\- ]+$/.test(name)) return setError("Letters, numbers, spaces, - and _ only.");
    if (containsProfanity(name)) return setError("That alias won't fly.");
    if (name === currentName) return setError("That's already your alias.");
    onConfirm(name);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="rise-in w-full max-w-sm rounded-2xl border border-border bg-popover p-5 glow-ring">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-base font-semibold">Change your alias</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              You can only do this once per session. After that, your alias is locked.
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
          <AnonAvatar name={value || currentName} seed={seed} size={40} />
          <input
            autoFocus
            value={value}
            maxLength={24}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && confirm()}
            className="w-full bg-transparent font-display text-sm outline-none"
            aria-label="New alias"
          />
          <button
            onClick={() => setValue(generateAlias())}
            aria-label="Roll a random alias"
            className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:text-signal"
          >
            <Dices className="size-4" />
          </button>
        </div>

        {error && (
          <p className="mt-2 flex items-center gap-1.5 text-[0.7rem] text-destructive">
            <AlertTriangle className="size-3.5" /> {error}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-border px-3.5 py-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Keep {currentName}
          </button>
          <button
            onClick={confirm}
            className="rounded-xl bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground"
          >
            Lock it in
          </button>
        </div>
      </div>
    </div>
  );
}
