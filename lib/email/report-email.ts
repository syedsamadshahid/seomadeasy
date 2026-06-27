function esc(v: string | number | null | undefined): string {
  return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function reportEmailHtml({
  domain,
  overallScore,
  geoScore,
  reportUrl,
  pdfUrl,
}: {
  domain: string;
  overallScore: number | null;
  geoScore: number | null;
  reportUrl: string;
  pdfUrl: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Vantage Report - ${esc(domain)}</title></head>
<body style="font-family:system-ui,sans-serif;background:#f9fafb;padding:32px;color:#111827;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #e5e7eb;">
    <h1 style="font-size:20px;margin:0 0 4px;">Your Vantage Report is Ready</h1>
    <p style="color:#6b7280;margin:0 0 24px;">${esc(domain)}</p>
    <div style="display:flex;gap:24px;margin-bottom:24px;">
      <div style="text-align:center;flex:1;background:#eff6ff;border-radius:8px;padding:16px;">
        <div style="font-size:36px;font-weight:700;color:#2563eb;">${esc(overallScore ?? "N/A")}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:4px;">Overall Score</div>
      </div>
      <div style="text-align:center;flex:1;background:#eff6ff;border-radius:8px;padding:16px;">
        <div style="font-size:36px;font-weight:700;color:#2563eb;">${esc(geoScore ?? "N/A")}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:4px;">AI Visibility</div>
      </div>
    </div>
    <a href="${esc(reportUrl)}" style="display:block;text-align:center;background:#2563eb;color:#fff;padding:12px;border-radius:8px;text-decoration:none;margin-bottom:12px;font-weight:600;">View Full Report</a>
    <a href="${esc(pdfUrl)}" style="display:block;text-align:center;background:#f3f4f6;color:#374151;padding:12px;border-radius:8px;text-decoration:none;font-weight:600;">Download PDF</a>
    <p style="margin-top:24px;font-size:12px;color:#9ca3af;text-align:center;">Vantage - SEO + AI Visibility</p>
  </div>
</body>
</html>`;
}
