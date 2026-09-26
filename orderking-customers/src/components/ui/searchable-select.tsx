import * as React from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";

export type Option = {
  value: string;
  label: string;
};

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  disabled = false,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const selected = options.find((o) => o.value === value);
  const filtered = React.useMemo(() => {
    if (!search) return options.slice(0, 50); // Show max 50 for perf
    const lower = search.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(lower)).slice(0, 50);
  }, [options, search]);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="flex w-full items-center justify-between rounded-xl border border-border bg-bg px-3 py-2 text-sm font-bold text-fg focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
        </button>
      </Popover.Trigger>
      <Popover.Content
        className="z-50 w-[300px] sm:w-[400px] rounded-xl border border-border bg-surface p-1 shadow-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        align="start"
        sideOffset={4}
      >
        <div className="flex items-center border-b border-border px-3 pb-2 pt-2">
          <Search className="mr-2 h-4 w-4 shrink-0 text-muted" />
          <input
            autoFocus
            className="flex h-8 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-50 text-fg"
            placeholder="Search city, code or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && filtered.length > 0) {
                onChange(filtered[0].value);
                setOpen(false);
                setSearch("");
              }
            }}
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto overflow-x-hidden p-1">
          {filtered.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted">No results found.</div>
          ) : (
            filtered.map((opt) => (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                  setSearch("");
                }}
                className="relative flex cursor-pointer select-none items-center rounded-md px-2 py-2 text-sm outline-none hover:bg-surface-2 hover:text-fg data-[disabled]:pointer-events-none data-[disabled]:opacity-50 transition-colors"
              >
                <Check
                  className={`mr-2 h-4 w-4 shrink-0 text-primary ${
                    value === opt.value ? "opacity-100" : "opacity-0"
                  }`}
                />
                <span className="truncate text-fg">{opt.label}</span>
              </div>
            ))
          )}
        </div>
      </Popover.Content>
    </Popover.Root>
  );
}
