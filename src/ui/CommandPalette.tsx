import { useEffect, useMemo, useState } from "react";

type Command = {
  id: string;
  label: string;
  run: () => void;
};

type CommandPaletteProps = {
  commands: Command[];
};

export function CommandPalette({ commands }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }

      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return commands;
    }
    return commands.filter((command) => command.label.toLowerCase().includes(normalized));
  }, [commands, query]);

  if (!open) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-50 bg-black/45">
      <div className="mx-auto mt-24 w-[min(560px,92vw)] rounded-md border border-white/20 bg-panel/95 p-3 shadow-glow">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoFocus
          placeholder="Type a command"
          className="w-full rounded border border-white/20 bg-black/40 px-3 py-2 text-sm text-sand outline-none"
        />
        <div className="mt-3 max-h-72 overflow-auto rounded border border-white/10">
          {filtered.map((command) => (
            <button
              key={command.id}
              type="button"
              className="block w-full border-b border-white/10 px-3 py-2 text-left text-sm text-sand hover:bg-cyan/10"
              onClick={() => {
                command.run();
                setOpen(false);
                setQuery("");
              }}
            >
              {command.label}
            </button>
          ))}
          {filtered.length === 0 && <div className="px-3 py-2 text-xs text-white/60">No commands found</div>}
        </div>
      </div>
    </div>
  );
}
