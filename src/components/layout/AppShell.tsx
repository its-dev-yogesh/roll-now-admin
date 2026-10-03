import { useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Button, CloseIcon, SearchInput } from "@/components/ui";
import { clearError, useLastError } from "@/hooks/resource";
import { useSession } from "@/lib/session";
import { LoginPage } from "@/pages/LoginPage";
import { NAV_ITEMS } from "./navigation";
import { ShellContext } from "./shell";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

/** Layout from the site's design reference: search above a floating sidebar panel, filter pills +
 * alerts + account across the top, page content below. */
export function AppShell({ children }: { children: ReactNode }) {
  const session = useSession();
  if (session.status === "loading") return <div className="empty">Loading…</div>;
  if (session.status === "signed-out") return <LoginPage />;
  return <SignedInShell>{children}</SignedInShell>;
}

function SignedInShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const error = useLastError();
  const [search, setSearch] = useState({ pathname, query: "" });
  const [tabsSlot, setTabsSlot] = useState<HTMLElement | null>(null);
  const query = search.pathname === pathname ? search.query : "";
  const section = NAV_ITEMS.find((item) => item.to === pathname);
  const placeholder = !section || section.to === "/" ? "Search" : `Search ${section.label.toLowerCase()}`;
  const setQuery = (next: string) => setSearch({ pathname, query: next });

  return (
    <ShellContext.Provider value={{ query, setQuery, tabsSlot }}>
      <div className="shell">
        <div className="shell-search">
          <SearchInput value={query} onChange={setQuery} placeholder={placeholder} aria-label={placeholder} />
        </div>
        <div className="shell-top">
          <TopBar onSlot={setTabsSlot} />
        </div>
        <div className="shell-side">
          <Sidebar />
        </div>
        <main className="shell-main">
          {error && (
            <div className="banner" role="alert">
              <span className="grow">{error}</span>
              <Button variant="ghost" small iconOnly aria-label="Dismiss" onClick={clearError}>
                <CloseIcon size={14} />
              </Button>
            </div>
          )}
          {children}
        </main>
      </div>
    </ShellContext.Provider>
  );
}
