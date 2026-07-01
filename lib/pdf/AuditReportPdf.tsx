import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10, color: "#1a1a1a" },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  logo: { width: 48, height: 48, marginRight: 12, objectFit: "contain" },
  brandName: { fontSize: 18, fontWeight: "bold" },
  domain: { fontSize: 10, color: "#6b7280", marginTop: 2 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: "bold", marginBottom: 6, color: "#111827" },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  label: { color: "#6b7280" },
  scoreBox: {
    borderRadius: 6,
    padding: "6 12",
    marginBottom: 20,
    flexDirection: "row",
    gap: 24,
  },
  scoreItem: { alignItems: "center" },
  scoreValue: { fontSize: 28, fontWeight: "bold" },
  scoreLabel: { fontSize: 9, color: "#6b7280", marginTop: 2 },
  accentLine: { height: 3, marginBottom: 20, borderRadius: 2 },
  footer: { position: "absolute", bottom: 24, left: 40, right: 40, fontSize: 8, color: "#9ca3af", textAlign: "center" },
});

type Category = { category: string; score: number | null; };
type Keyword = { term: string; volume: number | null; position: number | null; };
type GeoRun = { engine: string; mentioned: boolean; cited: boolean; sentiment: string | null; prominence?: number | null; };
type BacklinkSummary = { totalBacklinks: number; referringDomains: number; rank: number } | null;
type PerfPage = { url: string; lcp: number | null; cls: number | null; inp: number | null };
type FixItem = { category: string; impact: string; issue: string };

type Props = {
  domain: string;
  overallScore: number | null;
  geoScore: number | null;
  results: Category[];
  keywords: Keyword[];
  geoRuns: GeoRun[];
  backlinks?: BacklinkSummary;
  perfPages?: PerfPage[];
  fixes?: FixItem[];
  brandLogoUrl?: string | null;
  brandColor?: string | null;
  finishedAt?: Date | null;
};

function ms(value: number | null): string {
  if (value === null) return "–";
  return value >= 1000 ? `${(value / 1000).toFixed(2)}s` : `${Math.round(value)}ms`;
}

export function AuditReportPdf({
  domain, overallScore, geoScore, results, keywords, geoRuns,
  backlinks, perfPages = [], fixes = [],
  brandLogoUrl, brandColor, finishedAt,
}: Props) {
  const accent = brandColor ?? "#2563eb";
  const dateStr = finishedAt
    ? new Date(finishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {brandLogoUrl && <Image style={styles.logo} src={brandLogoUrl} />}
          <View>
            <Text style={styles.brandName}>{domain}</Text>
            <Text style={styles.domain}>SEO + AI Visibility Report · {dateStr}</Text>
          </View>
        </View>

        <View style={[styles.accentLine, { backgroundColor: accent }]} />

        <View style={[styles.scoreBox, { backgroundColor: accent + "15" }]}>
          <View style={styles.scoreItem}>
            <Text style={[styles.scoreValue, { color: accent }]}>{overallScore ?? "–"}</Text>
            <Text style={styles.scoreLabel}>Overall Score</Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={[styles.scoreValue, { color: accent }]}>{geoScore ?? "–"}</Text>
            <Text style={styles.scoreLabel}>AI Visibility</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category Breakdown</Text>
          {results.map((r) => (
            <View key={r.category} style={styles.row}>
              <Text style={styles.label}>{r.category}</Text>
              <Text>{r.score ?? "–"}</Text>
            </View>
          ))}
        </View>

        {backlinks && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Backlinks & Authority</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Total backlinks</Text>
              <Text>{backlinks.totalBacklinks.toLocaleString()}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Referring domains</Text>
              <Text>{backlinks.referringDomains.toLocaleString()}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Domain rank</Text>
              <Text>{backlinks.rank.toLocaleString()}</Text>
            </View>
          </View>
        )}

        {perfPages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performance — Core Web Vitals</Text>
            {perfPages.map((p, i) => (
              <View key={i} style={styles.row}>
                <Text style={styles.label}>{p.url}</Text>
                <Text>LCP {ms(p.lcp)} · INP {ms(p.inp)} · CLS {p.cls != null ? p.cls.toFixed(3) : "–"}</Text>
              </View>
            ))}
          </View>
        )}

        {fixes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Priority Fixes</Text>
            {fixes.map((f, i) => (
              <View key={i} style={styles.row}>
                <Text style={styles.label}>[{f.impact}] {f.category}</Text>
                <Text>{f.issue}</Text>
              </View>
            ))}
          </View>
        )}

        {keywords.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Keywords</Text>
            {keywords.slice(0, 10).map((k, i) => (
              <View key={i} style={styles.row}>
                <Text style={styles.label}>{k.term}</Text>
                <Text>Vol: {k.volume ?? "–"} · Pos: {k.position ?? "–"}</Text>
              </View>
            ))}
          </View>
        )}

        {geoRuns.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Engine Visibility</Text>
            {geoRuns.map((g, i) => (
              <View key={i} style={styles.row}>
                <Text style={styles.label}>{g.engine}</Text>
                <Text>
                  {g.mentioned ? "Mentioned" : "Not mentioned"} · {g.cited ? "Cited" : "Not cited"}
                  {g.prominence != null ? ` · prom ${g.prominence}/10` : ""}
                  {g.sentiment ? ` · ${g.sentiment}` : ""}
                </Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.footer}>
          Generated by Vantage — SEO + AI Visibility for Growing Teams
        </Text>
      </Page>
    </Document>
  );
}
