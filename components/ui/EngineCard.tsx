type Engine = "chatgpt" | "perplexity" | "gemini" | "google_aio";

const ENGINE_CONFIG: Record<Engine, { label: string; initial: string; bg: string; text: string }> = {
  chatgpt:    { label: "ChatGPT",    initial: "C", bg: "bg-black",              text: "text-white"                  },
  perplexity: { label: "Perplexity", initial: "P", bg: "bg-secondary-container", text: "text-on-secondary-container" },
  gemini:     { label: "Gemini",     initial: "G", bg: "bg-surface-variant",    text: "text-primary"                },
  google_aio: { label: "Google AIO", initial: "A", bg: "bg-primary",            text: "text-white"                  },
};

type Props = {
  engine: Engine;
  mentionRate: number | null;
  delta?: number | null;
  locked?: boolean;
  stagger?: number;
};

export function EngineCard({ engine, mentionRate, delta, locked = false, stagger }: Props) {
  const cfg = ENGINE_CONFIG[engine];
  const positive = typeof delta === "number" && delta > 0;
  const negative = typeof delta === "number" && delta < 0;

  return (
    <div
      className={[
        "mirror-card p-4 rounded-xl flex flex-col gap-2 transition-all duration-300 opacity-0 animate-pop-in",
        stagger ? `stagger-${stagger}` : "",
        locked ? "opacity-50" : "hover:scale-[1.02] hover:bg-white/80",
      ].join(" ")}
    >
      <div className="flex items-center gap-2">
        <div className={`size-8 ${cfg.bg} rounded-lg flex items-center justify-center ${cfg.text} font-bold text-xs`}>
          {cfg.initial}
        </div>
        <span className="text-xs font-black uppercase tracking-tight opacity-70">{cfg.label}</span>
        {locked && (
          <span className="material-symbols-outlined text-[14px] text-text-secondary ml-auto">lock</span>
        )}
      </div>
      <div className="flex items-end justify-between">
        <span className="text-xl font-black text-[#0F172A]">
          {mentionRate !== null ? `${mentionRate}%` : "—"}
        </span>
        {typeof delta === "number" && !locked && (
          <span className={`text-[12px] font-bold flex items-center ${positive ? "text-success" : negative ? "text-error" : "text-text-secondary"}`}>
            <span className="material-symbols-outlined text-[14px]">
              {positive ? "arrow_drop_up" : negative ? "arrow_drop_down" : "remove"}
            </span>
            {Math.abs(delta)}%
          </span>
        )}
      </div>
    </div>
  );
}
