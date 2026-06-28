type Props = {
  value: number | null;
  max?: number;
  color?: string;
  size?: number;
};

export function ScoreRing({ value, max = 100, color = "#4648d4", size = 48 }: Props) {
  const pct = value !== null ? Math.round((value / max) * 100) : 0;
  const bg =
    value !== null
      ? `radial-gradient(closest-side, white 79%, transparent 80% 100%), conic-gradient(${color} ${pct}%, #e2e8f0 0)`
      : `radial-gradient(closest-side, white 79%, transparent 80% 100%), conic-gradient(#e2e8f0 100%)`;

  return (
    <div
      style={{ width: size, height: size, background: bg, borderRadius: "50%" }}
      aria-hidden="true"
    />
  );
}
