import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container-mvh py-24 text-center min-h-[60vh] flex flex-col items-center justify-center">
      <p className="eyebrow mb-4">404</p>
      <h1 className="font-display text-5xl text-primary mb-4">
        Página no encontrada
      </h1>
      <p className="text-primary/70 mb-8 max-w-md mx-auto">
        Parece que esta flor no está en nuestro jardín. ¿Te ayudamos a encontrar lo que buscas?
      </p>
      <div className="gold-divider max-w-xs mx-auto mb-10">
        <span className="text-accent">✦</span>
      </div>
      <div className="flex gap-4 flex-col sm:flex-row">
        <Link href="/" className="btn-primary">
          Volver al inicio
        </Link>
        <Link href="/categoria/arreglos-premium" className="btn-outline">
          Explorar catálogo
        </Link>
      </div>
    </div>
  );
}
