'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/cn';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: '◈' },
  { href: '/admin/productos', label: 'Productos', icon: '✦' },
  { href: '/admin/categorias', label: 'Categorías', icon: '❋' },
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

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
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

      {/* User + logout */}
      <div className="px-4 py-4 border-t border-white/10">
        {user && (
          <p className="text-xs text-surface/40 mb-2 truncate">
            {user.firstName} · {user.role}
          </p>
        )}
        <button
          onClick={handleLogout}
          className="text-xs text-surface/50 hover:text-surface transition-colors"
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
