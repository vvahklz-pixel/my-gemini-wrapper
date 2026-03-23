export default function Sparkline({
  closes,
  width = 80,
  height = 32,
  isUp,
}: {
  closes: (number | null)[];
  width?: number;
  height?: number;
  isUp: boolean;
}) {
  const valid = closes.filter((v): v is number => v !== null);
  if (valid.length < 2) return <div style={{ width, height }} />;

  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const range = max - min || 1;
  const pad = 2;

  const pts = valid
    .map((v, i) => {
      const x = pad + (i / (valid.length - 1)) * (width - pad * 2);
      const y = pad + (height - pad * 2) - ((v - min) / range) * (height - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const color = isUp ? '#1AC47D' : '#F04452';
  const fill = isUp ? 'rgba(26,196,125,0.12)' : 'rgba(240,68,82,0.12)';
  const firstX = pad.toFixed(1);
  const lastX = (pad + (width - pad * 2)).toFixed(1);
  const bottomY = (height - pad).toFixed(1);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polygon points={`${firstX},${bottomY} ${pts} ${lastX},${bottomY}`} fill={fill} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
