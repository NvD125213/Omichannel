"use client";

import * as React from "react";
import { CircleHelp, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  HintTooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface ComboboxMultipleProps {
  label?: string;
  hint?: string;
  value: string[];
  onValueChange: (value: string[]) => void;
  options?: string[];
  placeholder?: string;
  className?: string;
  id?: string;
  chipsClassName?: string;
  ensureLeadingSlash?: boolean;
}

function normalizeToken(raw: string, ensureLeadingSlash = false) {
  const trimmed = raw.trim().replace(/,+$/, "");
  if (!trimmed) return "";
  if (ensureLeadingSlash && !trimmed.startsWith("/")) {
    return `/${trimmed}`;
  }
  return trimmed;
}

function FieldLabel({
  htmlFor,
  label,
  hint,
}: {
  htmlFor?: string;
  label: string;
  hint?: string;
}) {
  return (
    <div className="mb-2 flex items-center gap-1.5">
      <Label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </Label>
      {hint ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              aria-label={`Giải thích: ${label}`}
            >
              <CircleHelp className="size-3.5 text-destructive" />
            </button>
          </TooltipTrigger>
          <HintTooltipContent>{hint}</HintTooltipContent>
        </Tooltip>
      ) : null}
    </div>
  );
}

export function ComboboxMultiple({
  label,
  hint,
  value,
  onValueChange,
  options = [],
  placeholder = "Nhập giá trị rồi nhấn Enter...",
  className,
  id,
  chipsClassName,
  ensureLeadingSlash = false,
}: ComboboxMultipleProps) {
  const [inputValue, setInputValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const addToken = React.useCallback(
    (raw: string) => {
      const token = normalizeToken(raw, ensureLeadingSlash);
      if (!token) return;

      if (!value.includes(token)) {
        onValueChange([...value, token]);
      }
      setInputValue("");
    },
    [ensureLeadingSlash, onValueChange, value],
  );

  const removeToken = React.useCallback(
    (token: string) => {
      onValueChange(value.filter((item) => item !== token));
    },
    [onValueChange, value],
  );

  const suggestions = React.useMemo(() => {
    const query = inputValue.trim().toLowerCase();
    if (!query) return [];

    return options
      .filter(
        (option) =>
          !value.includes(option) && option.toLowerCase().includes(query),
      )
      .slice(0, 8);
  }, [inputValue, options, value]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addToken(inputValue);
      return;
    }

    if (event.key === "Backspace" && !inputValue && value.length > 0) {
      onValueChange(value.slice(0, -1));
    }
  };

  return (
    <div className={className}>
      {label ? <FieldLabel htmlFor={id} label={label} hint={hint} /> : null}

      <div
        className={cn(
          "rounded-lg border border-input/80 bg-white shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/30 dark:bg-card",
          chipsClassName,
        )}
        onClick={() => inputRef.current?.focus()}
      >
        <div className="flex min-h-9 flex-wrap items-center gap-1.5 px-2.5 py-1.5">
          {value.map((token) => (
            <span
              key={token}
              className="inline-flex max-w-full items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-foreground"
            >
              <span className="truncate">{token}</span>
              <button
                type="button"
                className="rounded-sm text-muted-foreground transition-colors hover:text-foreground"
                onClick={(event) => {
                  event.stopPropagation();
                  removeToken(token);
                }}
                aria-label={`Xóa ${token}`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}

          <input
            ref={inputRef}
            id={id}
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => addToken(inputValue)}
            placeholder={value.length === 0 ? placeholder : ""}
            className="min-w-[96px] flex-1 bg-transparent py-0.5 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        {suggestions.length > 0 ? (
          <ul className="border-t border-border/60 bg-white p-1 dark:bg-card">
            {suggestions.map((suggestion) => (
              <li key={suggestion}>
                <button
                  type="button"
                  className="w-full rounded-md px-2.5 py-1.5 text-left text-sm text-foreground/90 transition-colors hover:bg-muted/60"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => addToken(suggestion)}
                >
                  {suggestion}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

export { FieldLabel as ComboboxMultipleFieldLabel };
