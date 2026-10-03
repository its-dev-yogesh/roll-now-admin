import { useContext, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ShellContext } from "./shell";
import { cx } from "@/components/ui";

export interface TabOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

export interface TopBarTabsProps<T extends string> {
  options: TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** Page-level filter pills, rendered into the top bar (like the site's category pills). */
export function TopBarTabs<T extends string>({ options, value, onChange }: TopBarTabsProps<T>): ReactNode {
  const { tabsSlot } = useContext(ShellContext);
  if (!tabsSlot) return null;
  return createPortal(
    <div className="tabs" role="tablist">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={option.value === value}
          className={cx("tab", option.value === value && "active")}
          onClick={() => onChange(option.value)}
        >
          {option.label}
          {option.count !== undefined && <span className="tab-count">{option.count}</span>}
        </button>
      ))}
    </div>,
    tabsSlot,
  );
}
