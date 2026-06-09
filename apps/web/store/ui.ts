// ui.ts – Zustand‑free UI store using React's useSyncExternalStore
import { useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark' | 'system';

type ModalState = {
  id: string;
  props?: Record<string, any>;
};

export interface UIState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  modals: ModalState[];
  openModal: (id: string, props?: Record<string, any>) => void;
  closeModal: (id?: string) => void;
  snackbars: { message: string; key: string }[];
  pushSnackbar: (msg: string) => void;
  removeSnackbar: (key: string) => void;
}

// ─── Store implementation (vanilla) ────────────────────────────────────────

type Listener = () => void;

class UIStore {
  private theme: Theme = 'system';
  private modals: ModalState[] = [];
  private snackbars: { message: string; key: string }[] = [];

  private listeners: Set<Listener> = new Set();

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private notify = () => {
    this.listeners.forEach((l) => l());
  };

  getSnapshot = (): UIState => ({
    theme: this.theme,
    setTheme: (theme) => this.setTheme(theme),
    modals: this.modals,
    openModal: (id, props) => this.openModal(id, props),
    closeModal: (id) => this.closeModal(id),
    snackbars: this.snackbars,
    pushSnackbar: (msg) => this.pushSnackbar(msg),
    removeSnackbar: (key) => this.removeSnackbar(key),
  });

  // --- actions ---
  setTheme = (theme: Theme) => {
    this.theme = theme;
    this.persist();
    this.notify();
  };

  openModal = (id: string, props?: Record<string, any>) => {
    this.modals = [...this.modals, { id, props }];
    this.notify();
  };

  closeModal = (id?: string) => {
    if (!id) {
      this.modals = this.modals.slice(0, -1);
    } else {
      this.modals = this.modals.filter((m) => m.id !== id);
    }
    this.notify();
  };

  pushSnackbar = (msg: string) => {
    const key = `${Date.now()}-${Math.random()}`;
    this.snackbars = [...this.snackbars, { message: msg, key }];
    this.notify();
  };

  removeSnackbar = (key: string) => {
    this.snackbars = this.snackbars.filter((s) => s.key !== key);
    this.notify();
  };

  // --- persistence (localStorage) ---
  private persist() {
    if (typeof window === 'undefined') return;
    localStorage.setItem(
      'ui_store',
      JSON.stringify({ theme: this.theme })
    );
  }

  private load() {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem('ui_store');
    if (raw) {
      try {
        const saved = JSON.parse(raw);
        if (saved.theme) this.theme = saved.theme;
      } catch {}
    }
  }

  constructor() {
    this.load();
  }
}

const store = new UIStore();

// ─── React hook ────────────────────────────────────────────────────────────

export const useUIStore = (): UIState => {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
};

export default useUIStore;
