"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStudio } from "@/components/studio-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ENGINE_LABEL, type Engine } from "@/lib/data/types";

export function CreateDiagramDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const { createDiagram, snapshot } = useStudio();
  const [name, setName] = useState("");
  const [engine, setEngine] = useState<Engine>(snapshot?.settings.defaultEngine ?? "postgresql");
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState(false);

  async function submit() {
    setPending(true);
    try {
      const diagram = await createDiagram({ name, engine, description });
      onOpenChange(false);
      setName("");
      setDescription("");
      router.push(`/diagrams/${diagram.id}`);
    } catch {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create new diagram</DialogTitle>
          <DialogDescription>Start with an empty canvas. Tables and relationships are saved on this device.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="diagram-name">Name</Label>
            <Input id="diagram-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Billing service" />
          </div>
          <div className="space-y-1.5">
            <Label>Database engine</Label>
            <Select value={engine} onValueChange={(value) => setEngine(value as Engine)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ENGINE_LABEL).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="diagram-description">Description</Label>
            <Textarea id="diagram-description" value={description} onChange={(event) => setDescription(event.target.value)} />
          </div>
          <Button disabled={pending || !name.trim()} onClick={() => void submit()}>
            Create diagram
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
