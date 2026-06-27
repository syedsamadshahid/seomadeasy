"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Share2, Copy, Check } from "lucide-react";

type Props = { auditId: string };

export function ShareDialog({ auditId }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCreate() {
    setLoading(true);
    try {
      const res = await fetch(`/api/audits/${auditId}/share`, { method: "POST" });
      const data = await res.json();
      setUrl(data.url);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Share2 className="mr-1 h-4 w-4" />
        Share
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Report</DialogTitle>
        </DialogHeader>
        {!url ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Create a read-only shareable link for this report.
            </p>
            <Button onClick={handleCreate} disabled={loading} className="w-full">
              {loading ? "Creating…" : "Create Share Link"}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Anyone with this link can view the report.
            </p>
            <div className="flex gap-2">
              <Input value={url} readOnly className="text-xs" />
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
