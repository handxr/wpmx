import { homedir } from "os";
import { join } from "path";
import { mkdirSync, readFileSync, existsSync } from "fs";

const DIR = join(homedir(), ".tsprint");
const HISTORY_PATH = join(DIR, "history.json");
const SETTINGS_PATH = join(DIR, "settings.json");

function ensureDir() {
  if (!existsSync(DIR)) {
    mkdirSync(DIR, { recursive: true });
  }
}

function readJSON<T>(path: string, fallback: T): T {
  try {
    if (!existsSync(path)) return fallback;
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return fallback;
  }
}

export type HistoryEntry = {
  wpm: number;
  accuracy: number;
  duration: number;
  date: string;
};

export type Settings = {
  lastDuration: 15 | 30 | 60;
};

export function getHistory(): HistoryEntry[] {
  return readJSON<HistoryEntry[]>(HISTORY_PATH, []);
}

export function saveResult(entry: HistoryEntry): void {
  ensureDir();
  const history = getHistory();
  history.push(entry);
  Bun.write(HISTORY_PATH, JSON.stringify(history, null, 2));
}

export function getPersonalBest(duration: number): number | null {
  const history = getHistory().filter((e) => e.duration === duration);
  if (history.length === 0) return null;
  return Math.max(...history.map((e) => e.wpm));
}

export function loadSettings(): Settings {
  return readJSON<Settings>(SETTINGS_PATH, { lastDuration: 30 });
}

export function saveSettings(settings: Settings): void {
  ensureDir();
  Bun.write(SETTINGS_PATH, JSON.stringify(settings, null, 2));
}
