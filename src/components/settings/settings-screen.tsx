"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { Info, Keyboard, Palette, Save, Settings2, SlidersHorizontal, Users } from "lucide-react";
import { DiagramView } from "@/components/diagram/diagram-view";
import { useStudio } from "@/components/studio-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ACCENT_COLORS, ENGINE_LABEL, type Engine, type Settings } from "@/lib/data/types";
import { applyAppearance } from "@/lib/appearance";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "general", label: "General", icon: Settings2 },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "editor", label: "Editor", icon: SlidersHorizontal },
  { id: "autosave", label: "Autosave", icon: Save },
  { id: "export", label: "Export & Import", icon: Keyboard },
  { id: "team", label: "Team", icon: Users },
  { id: "about", label: "About", icon: Info },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

export function SettingsScreen() {
  const { setTheme } = useTheme();
  const { snapshot, currentDiagram, updateSettings } = useStudio();
  const [section, setSection] = useState<SectionId>("general");
  const [draft, setDraft] = useState<Settings | null>(null);
  const [pending, setPending] = useState(false);
  const active = draft ?? snapshot?.settings ?? null;
  const theme = active?.theme;
  const accent = active?.accent;

  useEffect(() => {
    if (!theme || !accent) return;
    applyAppearance({ theme, accent }, setTheme);
  }, [theme, accent, setTheme]);

  if (!snapshot || !active) return null;
  const dirty = JSON.stringify(active) !== JSON.stringify(snapshot.settings);

  function patch(partial: Partial<Settings>) {
    if (!snapshot) return;
    const base = snapshot.settings;
    setDraft((current) => ({ ...(current ?? base), ...partial }));
  }

  async function save() {
    if (!active) return;
    const next = active;
    setPending(true);
    try {
      await updateSettings(next);
      setDraft(null);
    } finally {
      setPending(false);
    }
  }

  function reset() {
    if (!snapshot) return;
    setDraft(null);
    applyAppearance({ theme: snapshot.settings.theme, accent: snapshot.settings.accent }, setTheme);
  }

  const canvas = active.theme === "light" ? active.lightCanvasBackground : active.canvasBackground;

  return (
    <div className="animate-fade-in grid gap-4 px-6 py-5 xl:grid-cols-[200px_minmax(0,1fr)_320px]">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-[12px] text-muted-foreground">Customize your ERD Studio experience, preferences and workspace.</p>
        <nav className="mt-4 space-y-1">
          {SECTIONS.map((item) => (
            <button
              key={item.id}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] text-muted-foreground hover:bg-secondary",
                section === item.id && "bg-primary text-primary-foreground hover:bg-primary",
              )}
              onClick={() => setSection(item.id)}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="space-y-4">
        {(section === "general" || section === "appearance") && (
          <Card title="General Settings">
            <Field label="Application name">
              <Input value={active.applicationName} onChange={(event) => patch({ applicationName: event.target.value })} />
            </Field>
            <Field label="Language">
              <Select value={active.language} onValueChange={(language) => patch({ language })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Spanish">Spanish</SelectItem>
                  <SelectItem value="German">German</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Default database type">
              <Select value={active.defaultEngine} onValueChange={(defaultEngine) => patch({ defaultEngine: defaultEngine as Engine })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ENGINE_LABEL).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <p className="rounded-lg bg-secondary px-3 py-2 text-[12px] leading-5 text-muted-foreground">
              Your diagrams are stored in this app&apos;s local data file. They stay on this device until a backend is connected.
            </p>
          </Card>
        )}

        {(section === "general" || section === "editor") && (
          <Card title="Diagram Settings">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Default view">
                <Select value={active.defaultView} onValueChange={(defaultView) => patch({ defaultView: defaultView as Settings["defaultView"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="table">Table view</SelectItem>
                    <SelectItem value="sql">SQL view</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Default grid size">
                <Input type="number" min={8} max={80} value={active.gridSize} onChange={(event) => patch({ gridSize: Number(event.target.value) || 20 })} />
              </Field>
            </div>
            <Field label="Canvas background">
              <Input
                value={canvas}
                onChange={(event) =>
                  patch(active.theme === "light" ? { lightCanvasBackground: event.target.value } : { canvasBackground: event.target.value })
                }
              />
            </Field>
            <Toggle label="Node snap to grid" checked={active.snapToGrid} onChange={(snapToGrid) => patch({ snapToGrid })} />
            <Toggle label="Show minimap" checked={active.showMinimap} onChange={(showMinimap) => patch({ showMinimap })} />
            <Toggle label="Show connection handles" checked={active.showConnectionHandles} onChange={(showConnectionHandles) => patch({ showConnectionHandles })} />
          </Card>
        )}

        {(section === "general" || section === "appearance") && (
          <Card title="Theme Settings">
            <div className="grid grid-cols-2 gap-2">
              <button className={cn("rounded-lg border px-3 py-3 text-left text-[13px]", active.theme === "dark" && "border-primary")} onClick={() => patch({ theme: "dark" })}>
                Dark
                <span className="mt-1 block text-[11px] text-muted-foreground">Modern dark theme</span>
              </button>
              <button className={cn("rounded-lg border px-3 py-3 text-left text-[13px]", active.theme === "light" && "border-primary")} onClick={() => patch({ theme: "light" })}>
                Light
                <span className="mt-1 block text-[11px] text-muted-foreground">Clean and minimal</span>
              </button>
            </div>
            <div className="mt-3">
              <Label>Accent color</Label>
              <div className="mt-2 flex gap-2">
                {ACCENT_COLORS.map((color) => (
                  <button
                    key={color}
                    aria-label={`Accent ${color}`}
                    className={cn("h-6 w-6 rounded-full", active.accent.toLowerCase() === color && "ring-2 ring-offset-2 ring-offset-card ring-foreground")}
                    style={{ background: color }}
                    onClick={() => patch({ accent: color })}
                  />
                ))}
              </div>
            </div>
          </Card>
        )}

        {section === "autosave" && (
          <Card title="Autosave">
            <Toggle label="Save diagram edits automatically" checked={active.autosave} onChange={(autosave) => patch({ autosave })} />
            <p className="text-[12px] leading-5 text-muted-foreground">
              Table moves, colors, and new relationships write through the local API as soon as you finish the action. The top bar shows Saving, then All changes saved.
            </p>
          </Card>
        )}

        {section === "export" && (
          <Card title="Export & Import">
            <p className="text-[13px] text-muted-foreground">JSON and SQL download from the Import / Export page. PNG uses the canvas. PDF uses the browser print dialog.</p>
            <Toggle label="Show notifications for saves" checked={active.showNotifications} onChange={(showNotifications) => patch({ showNotifications })} />
          </Card>
        )}

        {section === "team" && (
          <Card title="Team">
            <p className="text-[12px] text-muted-foreground">Local members only. Invites arrive when the backend is connected.</p>
            <ul className="space-y-2">
              {snapshot.team.map((member) => (
                <li key={member.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <span>
                    <span className="block text-[13px] font-medium">{member.name}</span>
                    <span className="text-[12px] text-muted-foreground">{member.email}</span>
                  </span>
                  <span className="text-[12px] text-muted-foreground">{member.role}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {section === "about" && (
          <Card title="About">
            <p className="text-[13px] leading-6 text-muted-foreground">
              ERD Studio 0.1 stores its snapshot in <code>data/db.json</code>. Route handlers call <code>StudioRepository</code>. Replacing <code>JsonRepository</code> is the seam for the future backend.
            </p>
          </Card>
        )}

        {dirty && (
          <div className="sticky bottom-3 flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 shadow-lg duration-slow">
            <div>
              <p className="text-[13px] font-medium">Unsaved changes</p>
              <p className="text-[12px] text-muted-foreground">You have unsaved changes in your settings.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={reset}>Reset</Button>
              <Button disabled={pending} onClick={() => void save()}>Save changes</Button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <Card title="Preview">
          <p className="mb-2 text-[12px] text-muted-foreground">This is how your settings look in the editor.</p>
          <div className="h-56 overflow-hidden rounded-lg border border-border">
            {currentDiagram && <DiagramView diagramId={currentDiagram.id} mode="readonly" canvasColor={canvas} />}
          </div>
        </Card>
        <Card title="Additional Options">
          <Toggle label="Enable keyboard shortcuts" checked={active.keyboardShortcuts} onChange={(keyboardShortcuts) => patch({ keyboardShortcuts })} />
          <Toggle label="Show notifications" checked={active.showNotifications} onChange={(showNotifications) => patch({ showNotifications })} />
          <Toggle label="Enable AI assistant" checked={active.aiAssistant} onChange={(aiAssistant) => patch({ aiAssistant })} />
          <p className="text-[11px] leading-5 text-muted-foreground">The assistant flag is stored for a future backend. This build does not call a model.</p>
        </Card>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-4">
      <h2 className="text-[13px] font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5 text-[12px]">
      <span className="font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[13px]">
      <span>{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}
