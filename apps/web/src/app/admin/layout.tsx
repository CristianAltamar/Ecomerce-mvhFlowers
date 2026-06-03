'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { authFetch } from '@/lib/auth-fetch';
import { cn } from '@/lib/cn';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: '◈' },
  { href: '/admin/productos', label: 'Productos', icon: '✦' },
  { href: '/admin/categorias', label: 'Categorías', icon: '❋' },
  { href: '/admin/media', label: 'Media', icon: '▦' },
  { href: '/admin/pedidos', label: 'Pedidos', icon: '◎' },
  { href: '/admin/cupones', label: 'Cupones', icon: '⊛' },
  { href: '/admin/entregas', label: 'Entregas', icon: '◉' },
  { href: '/admin/contenido', label: 'Contenido', icon: '✎' },
  { href: '/admin/configuracion/temas', label: 'Temas', icon: '◐' },
];

function AdminSidebar() {
  const pathname = usePathname();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [clearing, setClearing] = useState(false);
  const [clearMsg, setClearMsg] = useState('');

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  const handleClearCache = async () => {
    setClearing(true);
    setClearMsg('');
    try {
      const result = await authFetch<{ cleared: number }>('/admin/cache/clear', { method: 'POST' });
      await fetch('/api/revalidate', { method: 'POST' });
      setClearMsg(`✓ ${result.cleared} entradas`);
    } catch {
      setClearMsg('Error');
    } finally {
      setClearing(false);
      setTimeout(() => setClearMsg(''), 3000);
    }
  };

  return (
    <aside className="w-56 min-h-screen bg-ink flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <span className="font-display text-lg text-surface">MVH Admin</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map((item) => {
          const isActive =
            item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 text-sm transition-colors',
                isActive
                  ? 'bg-accent/20 text-accent-light'
                  : 'text-surface/60 hover:text-surface hover:bg-white/5',
              )}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Limpiar caché */}
      <div className="px-4 py-3 border-t border-white/10">
        <button
          onClick={handleClearCache}
          disabled={clearing}
          className="flex items-center gap-2 text-xs text-surface/40 hover:text-surface/80 transition-colors disabled:opacity-40 w-full cursor-pointer"
        >
          <span className={clearing ? 'animate-spin' : ''}>↺</span>
          <span>{clearing ? 'Limpiando…' : clearMsg || 'Limpiar caché'}</span>
        </button>
      </div>

      {/* User + logout */}
      <div className="px-4 py-4 border-t border-white/10">
        {user && (
          <p className="text-xs text-surface/40 mb-2 truncate">
            {user.firstName} · {user.role}
          </p>
        )}
        <button
          onClick={handleLogout}
          className="text-xs text-surface/50 hover:text-surface transition-color cursor-pointer"
        >
          Cerrar sesión →
        </button>
      </div>
    </aside>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    if (!isLoading && user !== null && user.role !== 'ADMIN' && user.role !== 'STAFF') {
      router.replace('/');
    }
    if (!isLoading && user === null) {
      router.replace('/auth/login?callbackUrl=%2Fadmin');
    }
  }, [user, isLoading, router]);

  // Show nothing while checking auth
  if (isLoading || !user || (user.role !== 'ADMIN' && user.role !== 'STAFF')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink">
        <p className="text-surface/40 animate-pulse text-sm">Verificando acceso…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-surface">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
