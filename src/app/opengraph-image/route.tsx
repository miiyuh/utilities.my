import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function handler() {
  const { width, height } = size;
  return new ImageResponse(
    (
      <div
        style={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #111827, #1f2937)',
          color: 'white',
          fontSize: 52,
          fontFamily: 'Inter, ui-sans-serif, system-ui',
          letterSpacing: -0.5,
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 900, padding: '0 48px' }}>
          <div style={{ fontSize: 28, opacity: 0.8, marginBottom: 10 }}>utilities.my</div>
          <div style={{ fontWeight: 700 }}>Useful online tools</div>
          <div style={{ fontSize: 24, opacity: 0.9, marginTop: 12 }}>
            BMI • QR • Colors • Units • Timezones • Markdown • Text
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
