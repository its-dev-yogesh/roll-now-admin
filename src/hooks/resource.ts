import { useEffect, useSyncExternalStore } from "react";

export interface WithId {
  id: string;
}

/** Same surface the pages used with local data, now backed by the API. Mutations resolve once saved. */
export interface Collection<T extends WithId> {
  items: T[];
  loaded: boolean;
  add: (item: T) => Promise<void>;
  update: (id: string, patch: Partial<T>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  move: (id: string, delta: number) => Promise<void>;
  getById: (id: string) => T | undefined;
  reload: () => Promise<void>;
}

export interface ResourceConfig<T> {
  list: () => Promise<T[]>;
  create?: (item: T) => Promise<unknown>;
  update?: (id: string, item: T) => Promise<unknown>;
  remove?: (id: string) => Promise<unknown>;
  move?: (id: string, delta: number) => Promise<unknown>;
}

/* Errors from background loads/mutations surface in one banner (AppShell). */
let lastError: string | null = null;
const errorListeners = new Set<() => void>();
export function reportError(error: unknown) {
  lastError = (error as Error)?.message ?? String(error);
  errorListeners.forEach((listener) => listener());
}
export function clearError() {
  lastError = null;
  errorListeners.forEach((listener) => listener());
}
export function useLastError() {
  return useSyncExternalStore(
    (listener) => {
      errorListeners.add(listener);
      return () => errorListeners.delete(listener);
    },
    () => lastError,
  );
}

const all: (() => Promise<void>)[] = [];
/** Reloads every resource that has been loaded (after changes with server-side side effects). */
export const reloadAll = () => Promise.all(all.map((reload) => reload())).then(() => undefined);

/** In-memory, shared cache of one API collection. Nothing is written to browser storage. */
export function createResource<T extends WithId>(config: ResourceConfig<T>): () => Collection<T> {
  let items: T[] = [];
  let loaded = false;
  let loading: Promise<void> | null = null;
  const listeners = new Set<() => void>();
  let snapshot = { items, loaded };
  const emit = () => {
    snapshot = { items, loaded };
    listeners.forEach((listener) => listener());
  };

  const reload = () =>
    (loading ??= config
      .list()
      .then((next) => {
        items = next;
        loaded = true;
        emit();
      })
      .catch(reportError)
      .finally(() => (loading = null)));
  all.push(() => (loaded ? reload() : Promise.resolve()));

  const mutate = async (run: () => Promise<unknown>) => {
    try {
      await run();
    } finally {
      await reload();
    }
  };

  const collection = {
    add: (item: T) => mutate(() => config.create!(item)),
    update: (id: string, patch: Partial<T>) => {
      const current = items.find((item) => item.id === id);
      if (!current) return Promise.reject(new Error("Not found"));
      return mutate(() => config.update!(id, { ...current, ...patch }));
    },
    remove: (id: string) => mutate(() => config.remove!(id)),
    move: (id: string, delta: number) => mutate(() => config.move!(id, delta)),
    reload,
  };

  return function useResource(): Collection<T> {
    const state = useSyncExternalStore(
      (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      () => snapshot,
    );
    useEffect(() => {
      if (!loaded) void reload();
    }, []);
    return { ...collection, items: state.items, loaded: state.loaded, getById: (id) => state.items.find((item) => item.id === id) };
  };
}
