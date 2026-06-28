type Variant = "good" | "warning" | "critical" | "running" | "queued" | "failed" | "done";

const STYLES: Record<Variant, { bg: string; text: string; border: string; label: string }> = {
  good:     { bg: "bg-success/10",  text: "text-success",  border: "border-success/20",  label: "Good"    },
  done:     { bg: "bg-success/10",  text: "text-success",  border: "border-success/20",  label: "Done"    },
  warning:  { bg: "bg-warning/10",  text: "text-warning",  border: "border-warning/20",  label: "Warning" },
  critical: { bg: "bg-danger/10",   text: "text-danger",   border: "border-danger/20",   label: "Critical"},
  failed:   { bg: "bg-danger/10",   text: "text-danger",   border: "border-danger/20",   label: "Failed"  },
  running:  { bg: "bg-primary/10",  text: "text-primary",  border: "border-primary/20",  label: "Running" },
  queued:   { bg: "bg-slate-100",   text: "text-slate-500",border: "border-slate-200",   label: "Queued"  },
};

type Props = {
  variant: Variant;
  label?: string;
};

export function StatusPill({ variant, label }: Props) {
  const s = STYLES[variant];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black ${s.bg} ${s.text} border ${s.border}`}>
      {label ?? s.label}
    </span>
  );
}
