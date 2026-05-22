import { ImageResponse } from 'next/og';

export const alt = 'MVH Flowers — Floristería premium en Barranquilla';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#3d0914',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
        }}
      >
        {/* Línea dorada superior */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, transparent, #d49328, transparent)',
          }}
        />

        {/* Eyebrow */}
        <div
          style={{
            color: '#d49328',
            fontSize: 16,
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            marginBottom: 24,
            fontFamily: 'serif',
          }}
        >
          Floristería · Barranquilla, Colombia
        </div>

        {/* Logo */}
        <div
          style={{
            color: '#faf7f4',
            fontSize: 80,
            fontStyle: 'italic',
            fontFamily: 'Georgia, serif',
            lineHeight: 1.1,
            marginBottom: 20,
          }}
        >
          MVH Flowers
        </div>

        {/* Divider */}
        <div
          style={{
            color: '#d49328',
            fontSize: 22,
            letterSpacing: '0.4em',
            marginBottom: 28,
          }}
        >
          ✦ ✦ ✦
        </div>

        {/* Tagline */}
        <div
          style={{
            color: '#e8ddd4',
            fontSize: 22,
            textAlign: 'center',
            maxWidth: 640,
            lineHeight: 1.5,
            fontFamily: 'Georgia, serif',
          }}
        >
          Flores frescas con entrega el mismo día en Barranquilla
        </div>

        {/* Línea dorada inferior */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, transparent, #d49328, transparent)',
          }}
        />
      </div>
    ),
    { ...size },
  );
}
