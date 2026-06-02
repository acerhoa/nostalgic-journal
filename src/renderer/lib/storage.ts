import { DEFAULT_SETTINGS, type Settings } from './constants';

/* ---------- persistence (entries + settings persist; calc does NOT) ---------- */
const LS_ENTRIES = 'nj-entries-v1';
const LS_SETTINGS = 'nj-settings-v1';

export type Entries = Record<string, string>;

export function loadEntries(): Entries {
  try {
    return JSON.parse(localStorage.getItem(LS_ENTRIES) ?? '') || {};
  } catch {
    return {};
  }
}

export function saveEntries(entries: Entries): void {
  try {
    localStorage.setItem(LS_ENTRIES, JSON.stringify(entries));
  } catch {
    /* ignore quota / serialization errors */
  }
}

export function loadSettings(): Settings {
  const settings: Settings = { ...DEFAULT_SETTINGS };
  try {
    Object.assign(settings, JSON.parse(localStorage.getItem(LS_SETTINGS) ?? '') || {});
  } catch {
    /* keep defaults */
  }
  return settings;
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(LS_SETTINGS, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}
