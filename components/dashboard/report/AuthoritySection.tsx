import type { AuthorityPayload } from "@/lib/audit/report-types";
import { SectionCard, StatPill } from "./ui";

type Props = { payload: AuthorityPayload | null; score: number | null };

function fmt(n: number): string {
  return n.toLocaleString();
}

export function AuthoritySection({ payload }: Props) {
  if (!payload) return null;
  const { backlinks, domainRank } = payload;

  return (
    <SectionCard id="authority" icon="verified" title="Backlinks & Domain Authority">
      <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatPill label="Total backlinks" value={fmt(backlinks.totalBacklinks)} accent />
        <StatPill label="Referring domains" value={fmt(backlinks.referringDomains)} />
        <StatPill label="Domain rank" value={fmt(domainRank.rank)} />
        <StatPill label="Rank ref. domains" value={fmt(domainRank.referringDomains)} />
      </div>
    </SectionCard>
  );
}
