import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'utilities.my';
export const contentType = 'image/png';

function parseColor(hsl: string) {
  // Expecting tokens like '29 39% 63%'; fallback to neutral
  try {
    const [h, s, l] = hsl.split(' ').map((t) => t.replace(/%/g, ''));
    const hh = Number(h) || 0;
    const ss = Number(s) || 40;
    const ll = Number(l) || 50;
    return `hsl(${hh} ${ss}% ${ll}%)`;
  } catch {
    return '#e5e7eb';
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title') || 'utilities.my';
  const subtitle = searchParams.get('subtitle') || 'Fast, privacy‑friendly web tools';
  const theme = (searchParams.get('theme') || 'dark').toLowerCase();

  const bg = theme === 'light' ? '#faf7f3' : '#0b0c0d';
  const fg = theme === 'light' ? '#0b0c0d' : '#f5f3f0';
  const accent = '#caa37a';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          background: bg,
          color: fg,
          padding: '64px',
        }}
      >
        <div style={{ fontSize: 42, opacity: 0.9, marginBottom: 16 }}>utilities.my</div>
        <div style={{ fontSize: 88, fontWeight: 800, lineHeight: 1.1 }}>{title}</div>
        <div style={{ marginTop: 24, fontSize: 30, color: accent }}>{subtitle}</div>
        <div
          style={{
            position: 'absolute',
            bottom: 48,
            right: 64,
            fontSize: 28,
            opacity: 0.7,
          }}
        >
          utilities.my
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
