import Link from 'next/link';

interface LogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  /** URL del logo ya resuelta para esta ubicación. Si se omite, se usa el logo de texto. */
  imageUrl?: string | null;
}

const IMG_HEIGHT = { sm: 28, md: 40, lg: 64 } as const;

export function Logo({ variant = 'dark', size = 'md', imageUrl }: LogoProps) {
  // Logo de imagen subido desde el panel (Temas → Marca)
  if (imageUrl) {
    return (
      <Link href="/" className="inline-flex items-center leading-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="MVH Flowers"
          style={{ height: IMG_HEIGHT[size], width: 'auto' }}
          className="object-contain"
        />
      </Link>
    );
  }

  // Respaldo: logo tipográfico
  const colorClass = variant === 'light' ? 'text-surface' : 'text-primary';
  const accentClass = variant === 'light' ? 'text-accent-light' : 'text-accent';
  const sizeClasses = {
    sm: { container: 'gap-0', main: 'text-lg', sub: 'text-[9px]' },
    md: { container: 'gap-0', main: 'text-2xl', sub: 'text-[10px]' },
    lg: { container: 'gap-0', main: 'text-4xl', sub: 'text-xs' },
  };
  const s = sizeClasses[size];

  return (
    <Link href="/" className={`inline-flex flex-col items-center ${s.container} leading-none`}>
      <span className={`font-display italic font-light ${s.main} ${colorClass}`}>
        <span className={accentClass}>M</span>VH
      </span>
      <span
        className={`font-serif uppercase tracking-[0.35em] ${s.sub} ${colorClass} opacity-80 mt-1`}
      >
        Flowers · Barranquilla
      </span>
    </Link>
  );
}
