import type { LinksPayload } from "@/lib/audit/report-types";
import { SectionCard } from "./ui";

type Props = { payload: LinksPayload | null };

export function BrokenLinksSection({ payload }: Props) {
  if (!payload) return null;

  const broken = payload.links.filter((l) => l.broken);
  const redirects = payload.links.filter((l) => !l.broken && l.redirectedTo);
  const checked = payload.links.length;

  return (
    <SectionCard
      id="links"
      icon="link"
      title="Broken Links"
      right={
        <span
          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
            broken.length === 0
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {broken.length === 0 ? "No broken links" : `${broken.length} broken`}
        </span>
      }
    >
      {broken.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <span
            className="material-symbols-outlined text-emerald-600 text-3xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            check_circle
          </span>
          <p className="mt-1 text-sm text-text-secondary">
            All {checked} checked link{checked === 1 ? "" : "s"} resolved successfully
            {redirects.length > 0 ? ` (${redirects.length} via redirect)` : ""}.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-alt border-b border-border">
                <th className="px-6 py-3 text-xs font-black text-text-secondary uppercase tracking-widest">URL</th>
                <th className="px-4 py-3 text-xs font-black text-text-secondary uppercase tracking-widest">Status</th>
                <th className="px-6 py-3 text-xs font-black text-text-secondary uppercase tracking-widest">Redirected to</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {broken.map((l) => (
                <tr key={l.url} className="hover:bg-surface-alt/50 transition-colors">
                  <td className="px-6 py-3 max-w-[360px]">
                    <p className="text-sm font-mono text-on-background truncate" title={l.url}>{l.url}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-mono">
                      {l.status ?? "ERR"}
                    </span>
                  </td>
                  <td className="px-6 py-3 max-w-[280px]">
                    <p className="text-sm font-mono text-text-secondary truncate" title={l.redirectedTo ?? ""}>
                      {l.redirectedTo ?? "—"}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}
