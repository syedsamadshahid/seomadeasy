export function toCsv(rows: Record<string, unknown>[], columns: string[]): string {
  const escape = (v: unknown): string => {
    const s = v == null ? "" : String(v);
    // Prefix Excel/Sheets formula triggers to prevent formula injection
    const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
    return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  const header = columns.map(escape).join(",");
  const body = rows.map((row) => columns.map((c) => escape(row[c])).join(",")).join("\n");
  return `${header}\n${body}`;
}

type Keyword = {
  term: string;
  volume: number | null;
  difficulty: number | null;
  cpc: number | null;
  position: number | null;
  intent: string | null;
};

export function keywordsCsv(keywords: Keyword[]): string {
  return toCsv(keywords as Record<string, unknown>[], [
    "term", "volume", "difficulty", "cpc", "position", "intent",
  ]);
}

type GeoRunRow = {
  engine: string;
  prompt: string;
  mentioned: boolean;
  cited: boolean;
  prominence: number | null;
  sentiment: string | null;
};

export function geoRunsCsv(runs: GeoRunRow[]): string {
  return toCsv(runs as Record<string, unknown>[], [
    "engine", "prompt", "mentioned", "cited", "prominence", "sentiment",
  ]);
}

type IssuePage = {
  url: string;
  issues: string;
};

export function issuesCsv(pages: IssuePage[]): string {
  return toCsv(pages as Record<string, unknown>[], ["url", "issues"]);
}
