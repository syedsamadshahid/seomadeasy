"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  projectId: string;
  initialCadence: "weekly" | "monthly";
  initialEnabled: boolean;
};

export function ScheduleForm({ projectId, initialCadence, initialEnabled }: Props) {
  const [cadence, setCadence] = useState<"weekly" | "monthly">(initialCadence);
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cadence, enabled }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-sm space-y-4">
      <div>
        <label className="text-sm font-medium">Delivery frequency</label>
        <p className="mb-2 text-xs text-muted-foreground">Receive a PDF report by email</p>
        <Select value={cadence} onValueChange={(v) => setCadence(v as "weekly" | "monthly")}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="enabled"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="h-4 w-4"
        />
        <label htmlFor="enabled" className="text-sm">
          Enable scheduled delivery
        </label>
      </div>
      <Button onClick={handleSave} disabled={saving}>
        {saved ? "Saved!" : saving ? "Saving…" : "Save Schedule"}
      </Button>
    </div>
  );
}
