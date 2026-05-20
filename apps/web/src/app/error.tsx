'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="container-mvh py-24 text-center min-h-[60vh] flex flex-col items-center justify-center">
      <p className="eyebrow mb-4">Algo salió mal</p>
      <h1 className="font-display text-4xl text-burgundy-900 mb-4">
        Disculpa, ocurrió un error inesperado
      </h1>
      <p className="text-burgundy-900/70 mb-8 max-w-md mx-auto">
        Hemos registrado el problema. Puedes intentar de nuevo o volver al inicio.
      </p>
      <div className="flex gap-4 flex-col sm:flex-row">
        <button onClick={reset} className="btn-primary">
          Reintentar
        </button>
        <Link href="/" className="btn-outline">
          Ir al inicio
        </Link>
      </div>
      {process.env.NODE_ENV === 'development' && (
        <pre className="mt-12 text-xs text-burgundy-900/60 max-w-2xl mx-auto text-left bg-cream-100 p-4 overflow-auto">
          {error.message}
          {error.digest && `\nDigest: ${error.digest}`}
        </pre>
      )}
    </div>
  );
}
