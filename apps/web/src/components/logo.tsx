import Link from 'next/link';

interface LogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ variant = 'dark', size = 'md' }: LogoProps) {
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
