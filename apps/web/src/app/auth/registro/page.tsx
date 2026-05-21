'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { ApiClientError } from '@/lib/api-client';

export default function RegistroPage() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
      });
      router.push('/');
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : 'Error de conexión. Intenta de nuevo.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[65vh] flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-gold-500 text-3xl mb-3">✦</div>
          <h1 className="font-display text-3xl text-burgundy-900 mb-2">Crea tu cuenta</h1>
          <p className="text-sm text-burgundy-900/60">
            ¿Ya tienes cuenta?{' '}
            <Link href="/auth/login" className="text-gold-700 hover:underline">
              Inicia sesión aquí
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="eyebrow block mb-1.5">Nombre</label>
              <input
                type="text"
                value={form.firstName}
                onChange={set('firstName')}
                required
                autoComplete="given-name"
                placeholder="María"
                className="w-full border border-burgundy-900/20 bg-cream-50 px-4 py-2.5 text-sm focus:outline-none focus:border-burgundy-900/60 transition-colors"
              />
            </div>
            <div>
              <label className="eyebrow block mb-1.5">Apellido</label>
              <input
                type="text"
                value={form.lastName}
                onChange={set('lastName')}
                required
                autoComplete="family-name"
                placeholder="García"
                className="w-full border border-burgundy-900/20 bg-cream-50 px-4 py-2.5 text-sm focus:outline-none focus:border-burgundy-900/60 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="eyebrow block mb-1.5">Correo electrónico</label>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              required
              autoComplete="email"
              placeholder="tu@email.com"
              className="w-full border border-burgundy-900/20 bg-cream-50 px-4 py-2.5 text-sm focus:outline-none focus:border-burgundy-900/60 transition-colors"
            />
          </div>

          <div>
            <label className="eyebrow block mb-1.5">Contraseña</label>
            <input
              type="password"
              value={form.password}
              onChange={set('password')}
              required
              autoComplete="new-password"
              placeholder="Mín. 8 caracteres, 1 mayúscula, 1 número"
              className="w-full border border-burgundy-900/20 bg-cream-50 px-4 py-2.5 text-sm focus:outline-none focus:border-burgundy-900/60 transition-colors"
            />
          </div>

          <div>
            <label className="eyebrow block mb-1.5">Teléfono <span className="text-burgundy-900/40">(opcional)</span></label>
            <input
              type="tel"
              value={form.phone}
              onChange={set('phone')}
              autoComplete="tel"
              placeholder="+57 300 123 4567"
              className="w-full border border-burgundy-900/20 bg-cream-50 px-4 py-2.5 text-sm focus:outline-none focus:border-burgundy-900/60 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>
      </div>
    </div>
  );
}
