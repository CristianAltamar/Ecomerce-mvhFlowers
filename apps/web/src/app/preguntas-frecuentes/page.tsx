import type { Metadata } from 'next';
import { apiFetch } from '@/lib/api-client';

export const metadata: Metadata = {
  title: 'Preguntas frecuentes',
  description: 'Resolvemos tus dudas sobre pedidos, entregas, pagos y arreglos florales en MVH Flores Barranquilla.',
};

interface FaqItem { q: string; a: string }

const DEFAULT_FAQS: FaqItem[] = [
  {
    q: '¿Hacen entregas el mismo día?',
    a: 'Sí. Realizamos entregas el mismo día en Barranquilla para pedidos realizados antes de las 5:00 PM. Para garantizar disponibilidad en fechas especiales, te recomendamos hacer tu pedido con anticipación.',
  },
  {
    q: '¿Cuáles son las zonas de entrega?',
    a: 'Hacemos entregas en toda Barranquilla. Para otras ciudades del Atlántico, comunícate con nosotros por WhatsApp para verificar disponibilidad y costo adicional.',
  },
  {
    q: '¿Cuánto cuesta el domicilio?',
    a: 'El costo del domicilio varía según el barrio o zona. Durante el proceso de compra podrás ver el valor exacto antes de confirmar tu pedido.',
  },
  {
    q: '¿Qué métodos de pago aceptan?',
    a: 'Aceptamos tarjetas de crédito y débito, PSE, Nequi y pago contra entrega en efectivo (disponible en zonas seleccionadas).',
  },
  {
    q: '¿Puedo personalizar un arreglo?',
    a: 'Claro que sí. Escríbenos por WhatsApp y cuéntanos la ocasión, las flores que te gustan y tu presupuesto. Con gusto diseñamos un arreglo único para ti.',
  },
  {
    q: '¿Puedo programar la entrega para una fecha específica?',
    a: 'Sí. Al momento de hacer tu pedido puedes seleccionar la fecha y franja horaria de entrega que más te convengan.',
  },
  {
    q: '¿Qué pasa si no hay nadie para recibir el pedido?',
    a: 'Nos comunicaremos contigo antes de la entrega. Si no es posible entregar, coordinamos un segundo intento o dejamos el pedido con un portero o vecino autorizado.',
  },
  {
    q: '¿Cuánto duran las flores?',
    a: 'Nuestras flores frescas duran entre 5 y 10 días con el cuidado adecuado. Te enviamos instrucciones de cuidado junto con cada pedido.',
  },
  {
    q: '¿Puedo hacer un pedido para regalo sorpresa?',
    a: 'Por supuesto. Puedes agregar una tarjeta personalizada con tu mensaje y pedimos discreción al entregar. El paquete no mostrará ningún precio.',
  },
  {
    q: '¿Tienen flores disponibles todo el año?',
    a: 'Trabajamos con flores de temporada para garantizar la mejor calidad y precio. La disponibilidad puede variar, pero siempre tenemos hermosas opciones para cada ocasión.',
  },
];

async function getFaqs(): Promise<FaqItem[] | null> {
  try {
    const data = await apiFetch<{ key: string; content: string }>('/site-content/faq', {
      revalidate: 3600,
    });
    if (!data.content) return null;
    return JSON.parse(data.content) as FaqItem[];
  } catch {
    return null;
  }
}

export default async function FaqPage() {
  const dbFaqs = await getFaqs();
  const faqs = dbFaqs ?? DEFAULT_FAQS;

  return (
    <div className="container-mvh py-16 lg:py-24">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="eyebrow mb-4">MVH Flores</p>
          <h1 className="font-display text-5xl lg:text-6xl text-burgundy-900">
            Preguntas frecuentes
          </h1>
          <div className="gold-divider mt-8 max-w-xs mx-auto">
            <span className="text-gold-500">✦</span>
          </div>
        </div>

        {/* FAQ list */}
        <dl className="space-y-0 divide-y divide-burgundy-900/10">
          {faqs.map((item, i) => (
            <div key={i} className="py-6">
              <dt className="font-display text-lg text-burgundy-900 mb-2">{item.q}</dt>
              <dd className="text-sm text-burgundy-900/70 leading-relaxed">{item.a}</dd>
            </div>
          ))}
        </dl>

        {/* CTA */}
        <div className="mt-14 text-center border border-burgundy-900/10 p-8">
          <p className="font-display text-xl text-burgundy-900 mb-3">
            ¿No encontraste tu respuesta?
          </p>
          <p className="text-sm text-burgundy-900/60 mb-6">
            Escríbenos y te respondemos en minutos.
          </p>
          <a
            href="/contacto"
            className="btn-outline inline-flex"
          >
            Contáctanos →
          </a>
        </div>
      </div>
    </div>
  );
}
