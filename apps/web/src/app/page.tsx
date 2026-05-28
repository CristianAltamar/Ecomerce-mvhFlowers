import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import { ProductCard } from '@/components/product-card';

const WHATSAPP_LINK = process.env.NEXT_PUBLIC_WHATSAPP_LINK ?? 'https://wa.me/573224513906';

// Categorías "ocasión" para el grid de la home
const OCCASION_TILES = [
  { slug: 'amor', name: 'Amor', img: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=400&q=80' },
  { slug: 'amistad', name: 'Amistad', img: 'https://images.unsplash.com/photo-1454425064867-89343b51e9a3?w=400&q=80' },
  { slug: 'cumpleanos', name: 'Cumpleaños', img: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=400&q=80' },
  { slug: 'aniversarios', name: 'Aniversarios', img: 'https://images.unsplash.com/photo-1494972308805-463bc619d34e?w=400&q=80' },
  { slug: 'condolencias', name: 'Condolencias', img: 'https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?w=400&q=80' },
  { slug: 'nacimientos', name: 'Nacimientos', img: 'https://images.unsplash.com/photo-1496062031456-07b8f162a322?w=400&q=80' },
];

export default async function HomePage() {
  const [featured, onSale] = await Promise.all([
    api.getFeaturedProducts(8).catch(() => []),
    api.getOnSaleProducts(8).catch(() => []),
  ]);

  return (
    <>
      {/* ============ HERO ============ */}
      <section data-th-section="hero" className="relative overflow-hidden bg-surface text-primary min-h-[80vh] lg:min-h-[88vh] flex items-center">
        {/* Ornamento de fondo */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 30%, var(--th-accent-light) 0%, transparent 8%), radial-gradient(circle at 80% 70%, var(--th-accent) 0%, transparent 10%)',
            }}
          />
        </div>

        {/* Línea dorada decorativa */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gold-gradient opacity-60" />

        <div className="container-mvh relative grid lg:grid-cols-2 gap-12 py-20 lg:py-0">
          {/* Texto */}
          <div className="flex flex-col justify-center animate-fade-up">
            <p className="eyebrow text-accent mb-6">Floristería · Barranquilla</p>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-tight text-balance">
              ¿Tienes una
              <br />
              <span className="italic text-accent">fecha especial</span>
              <br />
              hoy?
            </h1>
            <p className="mt-8 text-lg lg:text-xl text-primary/85 font-serif leading-relaxed max-w-xl">
              Cumpleaños, aniversarios, amor o simplemente porque sí — hacemos llegar flores
              frescas a cualquier dirección en Barranquilla el mismo día.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link href="/categoria/arreglos-premium" className="btn-on-dark">
                Comprar ahora
                <span className="ml-1">→</span>
              </Link>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 border border-primary/30 text-primary hover:border-accent hover:text-accent transition-all duration-300"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
                </svg>
                Pedir por WhatsApp
              </a>
            </div>

            {/* Trust badges */}
            <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-6 text-xs">
              {[
                { label: 'Entregas en', value: 'Barranquilla' },
                { label: 'Flores frescas', value: 'Seleccionadas' },
                { label: 'Pago', value: 'Seguro' },
                { label: 'Asesoría', value: 'Personalizada' },
              ].map((b, i) => (
                <div key={i} className="border-l-2 border-accent pl-3">
                  <p className="text-primary/60 uppercase tracking-widest">{b.label}</p>
                  <p className="text-primary mt-1 font-serif text-sm">{b.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Imagen hero */}
          <div className="relative hidden lg:flex items-center justify-center">
            <div className="relative w-full aspect-[3/4] max-w-md">
              {/* Marco dorado decorativo */}
              <div className="absolute -top-4 -left-4 right-8 bottom-8 border border-accent/60" />
              <div className="absolute top-8 left-8 -right-4 -bottom-4 border border-accent/40" />
              <div className="relative w-full h-full overflow-hidden shadow-premium-lg">
                <Image
                  src="https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=900&q=85"
                  alt="Arreglo floral premium MVH"
                  fill
                  priority
                  sizes="(min-width: 1024px) 40vw, 80vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-transparent" />
              </div>
              {/* Sello dorado */}
              <div className="absolute -bottom-2 -right-2 w-28 h-28 rounded-full bg-accent flex items-center justify-center text-ink font-display italic shadow-premium-lg rotate-[-12deg]">
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-widest">Entrega</p>
                  <p className="text-xl font-bold">Mismo</p>
                  <p className="text-xs italic">día</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Texto inferior */}
        <p className="absolute bottom-6 left-0 right-0 text-center text-primary/50 text-xs tracking-widest uppercase">
          Agenda tu pedido hoy · Entrega en el horario ideal
        </p>
      </section>

      {/* ============ OCASIONES ============ */}
      <section className="container-mvh py-24">
        <div className="text-center mb-16">
          <p className="eyebrow mb-3">Para cada momento</p>
          <h2 className="font-display text-4xl lg:text-5xl text-primary">
            Encuentra el arreglo perfecto
          </h2>
          <div className="gold-divider mt-6 max-w-xs mx-auto">
            <span className="text-accent">✦</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {OCCASION_TILES.map((tile, i) => (
            <Link
              key={tile.slug}
              href={`/categoria/${tile.slug}`}
              className="group block animate-fade-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="aspect-square relative overflow-hidden bg-muted">
                <Image
                  src={tile.img}
                  alt={tile.name}
                  fill
                  sizes="(min-width: 1024px) 16vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-ink/30 group-hover:bg-ink/50 transition-colors duration-500" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <h3 className="font-display text-2xl text-surface italic">{tile.name}</h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ============ ARREGLOS DESTACADOS ============ */}
      <section className="bg-muted py-24">
        <div className="container-mvh">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <p className="eyebrow mb-3">Selección de la casa</p>
              <h2 className="font-display text-4xl lg:text-5xl text-primary">
                Arreglos destacados
              </h2>
            </div>
            <Link
              href="/categoria/arreglos-premium"
              className="text-primary hover:text-accent transition-colors text-sm uppercase tracking-widest border-b border-primary/30 hover:border-accent pb-1 self-start md:self-end"
            >
              Ver todos los diseños →
            </Link>
          </div>

          {featured.length === 0 ? (
            <div className="text-center py-20">
              <p className="font-display text-2xl text-primary mb-3">
                Cargando creaciones florales…
              </p>
              <p className="text-sm text-primary/60">
                ¿No ves productos? Asegúrate de que la API esté corriendo y la BD seedeada.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.map((p, i) => (
                <div key={p.id} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                  <ProductCard product={p} priority={i < 4} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============ PROMOCIONES ============ */}
      {onSale.length > 0 && (
        <section className="container-mvh py-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <p className="eyebrow mb-3">Ofertas especiales</p>
              <h2 className="font-display text-4xl lg:text-5xl text-primary">
                Arreglos en promoción
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {onSale.map((p, i) => (
              <div key={p.id} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ============ CTA FINAL ============ */}
      <section className="relative bg-ink text-surface overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle at 70% 50%, var(--th-accent) 0%, transparent 30%)',
            }}
          />
        </div>
        <div className="container-mvh py-24 relative">
          <div className="max-w-2xl mx-auto text-center">
            <p className="eyebrow text-accent-light mb-4">¿Algo en mente?</p>
            <h2 className="font-display text-4xl lg:text-5xl mb-6 italic">
              Diseñamos tu arreglo a medida.
            </h2>
            <p className="text-muted/80 mb-10 text-lg">
              Cuéntanos la ocasión, el destinatario y tu presupuesto. Nuestra florista creará
              algo único para ti.
            </p>
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="btn-on-dark">
              Hablar con un florista
              <span className="ml-1">→</span>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
