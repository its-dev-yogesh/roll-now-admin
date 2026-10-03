import { useSyncExternalStore } from "react";
import { api, refreshSession, signIn, signOut } from "./api";

export interface AdminMe {
  id: string;
  name: string;
  email: string;
  roleId: string;
  role?: { id: string; name: string; permissions: string[] };
}

type State = { status: "loading" } | { status: "signed-out"; error?: string } | { status: "signed-in"; me: AdminMe };

let state: State = { status: "loading" };
const listeners = new Set<() => void>();
const set = (next: State) => {
  state = next;
  listeners.forEach((listener) => listener());
};

async function loadMe() {
  set({ status: "signed-in", me: await api<AdminMe>("/admin/me") });
}

/** Restores the session from the refresh cookie on page load. */
export async function bootSession() {
  if (await refreshSession()) await loadMe().catch(() => set({ status: "signed-out" }));
  else set({ status: "signed-out" });
}

export async function login(email: string, password: string) {
  try {
    await signIn(email, password);
    await loadMe();
  } catch (error) {
    set({ status: "signed-out", error: (error as Error).message });
  }
}

export async function logout() {
  await signOut();
  set({ status: "signed-out" });
}

export function useSession(): State {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
  );
}
