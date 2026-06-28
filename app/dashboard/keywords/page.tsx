import { getCurrentUser } from "@/lib/auth/dev-user";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function KeywordsPage() {
  const user = await getCurrentUser();

  const keywords = await prisma.keyword.findMany({
    where: { audit: { project: { userId: user.id } } },
    orderBy: { volume: "desc" },
    take: 100,
    select: {
      id: true,
      term: true,
      volume: true,
      difficulty: true,
      position: true,
      intent: true,
      audit: { select: { project: { select: { domain: true } } } },
    },
  });

  const tracked = keywords.length;
  const topTen = keywords.filter((k) => k.position !== null && k.position <= 10).length;

  return (
    <div className="p-8 bg-background min-h-full">
      <div className="max-w-[1200px] mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-black text-on-background tracking-tight">Keywords</h1>
          <p className="text-text-secondary text-sm mt-1">Keyword rankings across all audited sites.</p>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Tracked", value: tracked },
            { label: "Top 10", value: topTen },
            { label: "Improved", value: "—" },
            { label: "Dropped", value: "—" },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white border border-border rounded-xl p-5">
              <p className="text-xs font-black uppercase tracking-wider text-text-secondary mb-1">{kpi.label}</p>
              <p className="text-2xl font-black text-on-background">{kpi.value}</p>
            </div>
          ))}
        </div>

        {keywords.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-xl p-16 flex flex-col items-center text-center">
            <span className="material-symbols-outlined text-primary text-5xl mb-4 opacity-60">key</span>
            <h3 className="text-lg font-black text-on-background mb-2">No keywords yet</h3>
            <p className="text-text-secondary text-sm mb-6 max-w-xs">
              Keywords are collected when you run a site audit.
            </p>
            <Link href="/dashboard/sites" className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-primary-container transition-colors">
              Go to My Sites
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-alt border-b border-border">
                  <th className="px-6 py-4 text-xs font-black text-text-secondary uppercase tracking-widest">Keyword</th>
                  <th className="px-6 py-4 text-xs font-black text-text-secondary uppercase tracking-widest hidden sm:table-cell">Volume</th>
                  <th className="px-6 py-4 text-xs font-black text-text-secondary uppercase tracking-widest hidden md:table-cell">Difficulty</th>
                  <th className="px-6 py-4 text-xs font-black text-text-secondary uppercase tracking-widest">Position</th>
                  <th className="px-6 py-4 text-xs font-black text-text-secondary uppercase tracking-widest hidden lg:table-cell">Intent</th>
                  <th className="px-6 py-4 text-xs font-black text-text-secondary uppercase tracking-widest hidden lg:table-cell">Site</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {keywords.map((kw, i) => (
                  <tr key={kw.id} className={`hover:bg-surface-alt transition-colors ${i % 2 !== 0 ? "bg-surface-alt/50" : ""}`}>
                    <td className="px-6 py-3">
                      <span className="text-sm font-bold text-on-background font-mono">{kw.term}</span>
                    </td>
                    <td className="px-6 py-3 hidden sm:table-cell">
                      <span className="text-sm text-text-secondary">{kw.volume?.toLocaleString() ?? "—"}</span>
                    </td>
                    <td className="px-6 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 max-w-[80px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${kw.difficulty ?? 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-text-secondary">{kw.difficulty ?? "—"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`text-sm font-black ${kw.position !== null && kw.position <= 10 ? "text-success" : "text-on-background"}`}>
                        {kw.position ?? "—"}
                      </span>
                    </td>
                    <td className="px-6 py-3 hidden lg:table-cell">
                      <span className="text-xs text-text-secondary capitalize">{kw.intent ?? "—"}</span>
                    </td>
                    <td className="px-6 py-3 hidden lg:table-cell">
                      <span className="text-xs text-text-secondary truncate max-w-[100px] block">{kw.audit.project.domain}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
