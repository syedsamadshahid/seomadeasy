"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  projectId: string;
  initialLogoUrl: string;
  initialColor: string;
  canCustomColor: boolean;
};

export function BrandingForm({
  projectId,
  initialLogoUrl,
  initialColor,
  canCustomColor,
}: Props) {
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const [color, setColor] = useState(initialColor);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandLogoUrl: logoUrl || null,
          brandColor: canCustomColor ? (color || null) : undefined,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        setSaveError("Save failed. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-md space-y-4">
      <div>
        <label className="text-sm font-medium">Logo URL</label>
        <p className="mb-1 text-xs text-muted-foreground">
          Paste a publicly accessible image URL (https://...)
        </p>
        <Input
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="https://example.com/logo.png"
        />
      </div>
      {canCustomColor && (
        <div>
          <label className="text-sm font-medium">Brand Color</label>
          <p className="mb-1 text-xs text-muted-foreground">
            6-digit hex color for PDF accent (#RRGGBB)
          </p>
          <div className="flex items-center gap-2">
            <Input
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="#2563eb"
              className="w-32"
            />
            <div className="h-8 w-8 rounded border" style={{ backgroundColor: color }} />
          </div>
        </div>
      )}
      <Button onClick={handleSave} disabled={saving}>
        {saved ? "Saved!" : saving ? "Saving…" : "Save Branding"}
      </Button>
      {saveError && <p className="text-sm text-destructive mt-1">{saveError}</p>}
    </div>
  );
}
