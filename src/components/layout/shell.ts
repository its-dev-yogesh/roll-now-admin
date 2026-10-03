import { createContext, useContext } from "react";

export interface ShellContextValue {
  query: string;
  setQuery: (query: string) => void;
  tabsSlot: HTMLElement | null;
}

export const ShellContext = createContext<ShellContextValue>({ query: "", setQuery: () => {}, tabsSlot: null });

/** The top bar's search text, scoped to the current page (cleared on navigation). */
export function useShellSearch(): string {
  return useContext(ShellContext).query.trim().toLowerCase();
}
