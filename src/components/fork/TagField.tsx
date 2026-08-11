import { useId, useMemo, useRef, useState } from "react";
import { Plus, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Searchable multi-value field: type to filter suggestions, press Enter (or click
 * a suggestion) to add. Free text is always allowed — the list is a shortcut.
 */
export function TagField({
  label,
  items,
  onChange,
  options,
  placeholder = "Search or type your own…",
  maxSuggestions = 8,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  options: readonly string[];
  placeholder?: string;
  maxSuggestions?: number;
}) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const has = (name: string) => items.some((i) => i.toLowerCase() === name.toLowerCase());

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const starts: string[] = [];
    const contains: string[] = [];
    for (const name of options) {
      if (has(name)) continue;
      const lower = name.toLowerCase();
      if (!q) starts.push(name);
      else if (lower.startsWith(q)) starts.push(name);
      else if (lower.includes(q)) contains.push(name);
      if (starts.length >= maxSuggestions) break;
    }
    return [...starts, ...contains].slice(0, maxSuggestions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, options, items, maxSuggestions]);

  const visible = open && matches.length > 0;

  const add = (name: string) => {
    const value = name.trim();
    if (!value || has(value)) {
      setQuery("");
      return;
    }
    onChange([...items, value]);
    setQuery("");
    setActive(0);
  };

  const remove = (name: string) => onChange(items.filter((i) => i !== name));

  return (
    <div>
      <Label htmlFor={id} className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </Label>

      {items.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2">
          {items.map((item) => (
            <li key={item}>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1">
                {item}
                <button
                  type="button"
                  aria-label={`Remove ${item}`}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => remove(item)}
                >
                  <X className="size-3.5" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="relative mt-2">
        <div className="flex gap-2">
          <Input
            id={id}
            value={query}
            autoComplete="off"
            role="combobox"
            aria-expanded={visible}
            aria-autocomplete="list"
            placeholder={placeholder}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setActive(0);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              blurTimer.current = setTimeout(() => setOpen(false), 120);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const pick = visible ? matches[active] : undefined;
                add(query.trim() ? query : (pick ?? ""));
                return;
              }
              if (!visible) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => (i + 1) % matches.length);
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => (i - 1 + matches.length) % matches.length);
              } else if (e.key === "Escape") {
                setOpen(false);
              }
            }}
          />
          <button
            type="button"
            aria-label={`Add to ${label}`}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={() => add(query)}
          >
            <Plus className="size-4" />
          </button>
        </div>

        {visible && (
          <ul
            role="listbox"
            className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-border bg-popover p-1 text-sm shadow-lg"
          >
            {matches.map((name, i) => (
              <li key={name}>
                <button
                  type="button"
                  role="option"
                  aria-selected={i === active}
                  className={`block w-full rounded-lg px-3 py-2 text-left ${
                    i === active ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                  }`}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    if (blurTimer.current) clearTimeout(blurTimer.current);
                    add(name);
                  }}
                >
                  {name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
