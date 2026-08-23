import { useRef } from "react";

export type CellType = "text" | "number" | "time" | "select";
export type NavigateDirection = "up" | "down" | "left" | "right";

export interface CellOption {
  value: string;
  label: string;
}

export default function EditableCell({
  value,
  type = "text",
  options,
  isValid = true,
  isDirty = false,
  bgClass = "",
  onCommit,
  onNavigate,
  onPasteBulk,
  registerRef,
  compact = false
}: {
  value: string;
  type?: CellType;
  options?: CellOption[];
  isValid?: boolean;
  isDirty?: boolean;
  bgClass?: string;
  onCommit: (value: string) => void;
  onNavigate: (direction: NavigateDirection) => void;
  onPasteBulk?: (grid: string[][]) => void;
  registerRef?: (el: HTMLInputElement | HTMLSelectElement | null) => void;
  compact?: boolean;
}) {
  const localRef = useRef<HTMLInputElement | HTMLSelectElement | null>(null);

  function setRef(el: HTMLInputElement | HTMLSelectElement | null) {
    localRef.current = el;
    registerRef?.(el);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      onNavigate("down");
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      onNavigate("up");
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      onNavigate("down");
      return;
    }
    if (e.key === "ArrowLeft") {
      const input = e.currentTarget as HTMLInputElement;
      if (type === "select" || input.selectionStart === 0) {
        e.preventDefault();
        onNavigate("left");
      }
      return;
    }
    if (e.key === "ArrowRight") {
      const input = e.currentTarget as HTMLInputElement;
      if (type === "select" || input.selectionEnd === input.value.length) {
        e.preventDefault();
        onNavigate("right");
      }
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text/plain");
    if (!text.includes("\t") && !text.includes("\n")) return;
    if (!onPasteBulk) return;
    e.preventDefault();
    const grid = text
      .replace(/\r/g, "")
      .split("\n")
      .filter((line, i, arr) => !(i === arr.length - 1 && line === ""))
      .map((line) => line.split("\t"));
    onPasteBulk(grid);
  }

  const baseClass = `w-full min-w-0 rounded border border-transparent bg-transparent text-center font-semibold text-[#314238] outline-none transition hover:border-[#dfe6d7] focus:border-[#0d6b4d] focus:bg-white focus:shadow-[0_0_0_2px_rgba(13,107,77,0.15)] ${
    compact ? "px-0.5 py-0.5 text-[11px]" : "px-1 py-1 text-xs"
  } ${bgClass} ${isDirty ? "bg-[#fff9e0]" : ""} ${!isValid ? "border-[#e08a3f] bg-[#fdece0]" : ""}`;

  if (type === "select") {
    return (
      <select
        ref={(el) => setRef(el)}
        value={value}
        onChange={(e) => onCommit(e.target.value)}
        onKeyDown={handleKeyDown}
        className={baseClass}
        title={!isValid ? "Valeur invalide" : undefined}
      >
        <option value=""></option>
        {options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      ref={(el) => setRef(el)}
      type="text"
      inputMode={type === "number" ? "decimal" : undefined}
      placeholder={type === "time" ? "hh:mm" : undefined}
      value={value}
      onChange={(e) => onCommit(e.target.value)}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      className={baseClass}
      title={!isValid ? "Valeur invalide" : undefined}
    />
  );
}
