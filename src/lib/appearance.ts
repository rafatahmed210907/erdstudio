import type { Settings } from "@/lib/data/types";
import { hexToHslChannels } from "@/lib/utils";

const STORAGE_KEY = "erd-studio-appearance";

export type Appearance = {
  theme: Settings["theme"];
  accent: string;
};

export function readStoredAppearance(): Appearance | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Appearance>;
    if (parsed.theme !== "light" && parsed.theme !== "dark") return null;
    if (typeof parsed.accent !== "string" || !parsed.accent) return null;
    return { theme: parsed.theme, accent: parsed.accent };
  } catch {
    return null;
  }
}

export function persistAppearance(partial: Partial<Appearance>) {
  if (typeof window === "undefined") return;
  const current = readStoredAppearance();
  const next: Appearance = {
    theme: partial.theme ?? current?.theme ?? "dark",
    accent: partial.accent ?? current?.accent ?? "#2f6bff",
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function resolveAppearance(settings: Settings): Appearance {
  const stored = readStoredAppearance();
  return {
    theme: stored?.theme ?? settings.theme,
    accent: stored?.accent ?? settings.accent,
  };
}

export function applyAppearance(appearance: Appearance, setTheme: (theme: string) => void) {
  setTheme(appearance.theme);
  document.documentElement.style.setProperty("--primary", hexToHslChannels(appearance.accent));
  persistAppearance(appearance);
}
