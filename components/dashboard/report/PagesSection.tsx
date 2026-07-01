import { SectionCard } from "./ui";

export type PageRow = { url: string; estTraffic: number | null };

type Props = { pages: PageRow[] };

export function PagesSection({ pages }: Props) {
  if (pages.length === 0) return null;
  const ranked = [...pages].sort((a, b) => (b.estTraffic ?? 0) - (a.estTraffic ?? 0)).slice(0, 15);

  return (
    <SectionCard
      id="traffic"
      icon="trending_up"
      title="Top Pages by Traffic"
      right={<span className="text-xs text-text-secondary font-medium">{pages.length} page{pages.length === 1 ? "" : "s"}</span>}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-alt border-b border-border">
              <th className="px-6 py-3 text-xs font-black text-text-secondary uppercase tracking-widest">URL</th>
              <th className="px-6 py-3 text-xs font-black text-text-secondary uppercase tracking-widest text-right">Est. Traffic</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {ranked.map((page, i) => (
              <tr key={i} className="hover:bg-surface-alt/50 transition-colors">
                <td className="px-6 py-3 max-w-[460px]">
                  <p className="text-sm text-on-background truncate font-mono" title={page.url}>{page.url}</p>
                </td>
                <td className="px-6 py-3 text-sm text-text-secondary font-mono text-right">
                  {page.estTraffic != null ? page.estTraffic.toLocaleString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
