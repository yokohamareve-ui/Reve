import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: '#0a0a0a',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #d4af37',
        }}
      >
        <div
          style={{
            color: '#d4af37',
            fontSize: 18,
            fontWeight: 700,
            fontFamily: 'serif',
            letterSpacing: '-1px',
          }}
        >
          R
        </div>
      </div>
    ),
    size
  );
}
