import { useId, useMemo, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Text field with typeahead suggestions. Free text is always allowed — the list
 * is a shortcut, never a restriction, because Fork cannot know every program name.
 */
export function AutofillField({
  label,
  value,
  onChange,
  options,
  placeholder,
  maxSuggestions = 8,
  showAllOnFocus = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder?: string;
  maxSuggestions?: number;
  showAllOnFocus?: boolean;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const matches = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return showAllOnFocus ? options.slice(0, maxSuggestions) : [];
    const starts: string[] = [];
    const contains: string[] = [];
    for (const name of options) {
      const lower = name.toLowerCase();
      if (lower === q) continue;
      if (lower.startsWith(q)) starts.push(name);
      else if (lower.includes(q)) contains.push(name);
      if (starts.length >= maxSuggestions) break;
    }
    return [...starts, ...contains].slice(0, maxSuggestions);
  }, [value, options, maxSuggestions, showAllOnFocus]);

  const visible = open && matches.length > 0;

  const commit = (name: string) => {
    onChange(name);
    setOpen(false);
    setActive(0);
  };

  return (
    <div className="relative">
      <Label htmlFor={id} className="text-xs uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </Label>
      <Input
        id={id}
        value={value}
        autoComplete="off"
        role="combobox"
        aria-expanded={visible}
        aria-autocomplete="list"
        className="mt-1.5"
        {...(placeholder === undefined ? {} : { placeholder })}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          blurTimer.current = setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={(e) => {
          if (!visible) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => (i + 1) % matches.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => (i - 1 + matches.length) % matches.length);
          } else if (e.key === "Enter") {
            e.preventDefault();
            const pick = matches[active];
            if (pick) commit(pick);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
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
                  commit(name);
                }}
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
