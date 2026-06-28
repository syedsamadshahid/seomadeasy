"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { NewAuditForm } from "./NewAuditForm";

export function NewAuditDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="bg-primary hover:bg-primary-container text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all">
        <span className="material-symbols-outlined text-[18px]">add</span>
        New Audit
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start New Audit</DialogTitle>
        </DialogHeader>
        <div className="pt-2">
          <p className="text-sm text-text-secondary mb-4">
            Enter a domain to run a full SEO &amp; AI Visibility audit.
          </p>
          <NewAuditForm onSuccess={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
