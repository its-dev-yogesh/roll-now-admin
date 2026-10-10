import { cx } from "./cx";

export interface ChipOption {
  id: string;
  label: string;
}

export interface ChipPickerProps {
  options: ChipOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  /** Single-select: picking one replaces the rest. */
  single?: boolean;
  emptyMessage?: string;
}

/** Toggleable pills; multi-select keeps pick order. */
export function ChipPicker({ options, selected, onChange, single, emptyMessage = "Nothing to pick yet." }: ChipPickerProps) {
  if (options.length === 0) return <p className="muted text-xs">{emptyMessage}</p>;
  return (
    <div className="chips">
      {options.map((option) => {
        const on = selected.includes(option.id);
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={on}
            className={cx("chip", on && "on")}
            onClick={() => onChange(on ? selected.filter((id) => id !== option.id) : single ? [option.id] : [...selected, option.id])}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
