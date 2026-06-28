function esc(v: string | number | null | undefined): string {
  return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function scoreDelta(prev: number, next: number): string {
  const d = next - prev;
  if (d > 0) return `+${d}`;
  return String(d);
}

function trendColor(prev: number, next: number): string {
  if (next > prev) return "#16a34a";
  if (next < prev) return "#dc2626";
  return "#6b7280";
}

export function geoChangeEmailHtml({
  domain,
  previousScore,
  newScore,
  reportUrl,
}: {
  domain: string;
  previousScore: number;
  newScore: number;
  reportUrl: string;
}): string {
  const delta = scoreDelta(previousScore, newScore);
  const color = trendColor(previousScore, newScore);
  const direction = newScore > previousScore ? "improved" : "dropped";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>AI Visibility Change - ${esc(domain)}</title></head>
<body style="font-family:system-ui,sans-serif;background:#f9fafb;padding:32px;color:#111827;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #e5e7eb;">
    <h1 style="font-size:20px;margin:0 0 4px;">AI Visibility Update</h1>
    <p style="color:#6b7280;margin:0 0 24px;">${esc(domain)}</p>
    <p style="margin:0 0 24px;">Your AI visibility score has <strong>${esc(direction)}</strong> since last week.</p>
    <div style="display:flex;gap:24px;margin-bottom:24px;">
      <div style="text-align:center;flex:1;background:#f3f4f6;border-radius:8px;padding:16px;">
        <div style="font-size:36px;font-weight:700;color:#6b7280;">${esc(previousScore)}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:4px;">Previous</div>
      </div>
      <div style="text-align:center;flex:1;background:#eff6ff;border-radius:8px;padding:16px;">
        <div style="font-size:36px;font-weight:700;color:${esc(color)};">${esc(newScore)}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:4px;">Now (${esc(delta)})</div>
      </div>
    </div>
    <a href="${esc(reportUrl)}" style="display:block;text-align:center;background:#2563eb;color:#fff;padding:12px;border-radius:8px;text-decoration:none;font-weight:600;">View Full Report</a>
    <p style="margin-top:24px;font-size:12px;color:#9ca3af;text-align:center;">Vantage - SEO + AI Visibility</p>
  </div>
</body>
</html>`;
}
