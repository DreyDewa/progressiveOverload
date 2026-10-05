import { ImageResponse } from 'next/og';

/** Shared icon design: dark square with a bold lime "PO". Text stays within the centre 60% (maskable-safe). */
export function renderIcon(size: number) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#09090b',
          color: '#a3e635',
          fontSize: Math.round(size * 0.45),
          fontWeight: 800,
          letterSpacing: '-0.04em',
        }}
      >
        PO
      </div>
    ),
    { width: size, height: size },
  );
}
