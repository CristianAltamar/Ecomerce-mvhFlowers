import type { Metadata } from 'next';
import { ContactForm } from './contact-form';

const WHATSAPP_LINK = process.env.NEXT_PUBLIC_WHATSAPP_LINK ?? 'https://wa.me/573224513906';

export const metadata: Metadata = {
  title: 'Contacto',
  description: 'Contáctanos para pedidos especiales, asesoría personalizada y eventos.',
};

export default function ContactoPage() {
  return (
    <div className="container-mvh py-16 lg:py-24">
      <div className="max-w-3xl mx-auto text-center">
        <p className="eyebrow mb-4">Estamos para ti</p>
        <h1 className="font-display text-5xl lg:text-6xl text-primary mb-6">
          Hablemos de tu próximo arreglo
        </h1>
        <p className="text-primary/70 text-lg leading-relaxed">
          ¿Tienes una ocasión especial? Te ayudamos a elegir o diseñar el arreglo perfecto.
        </p>
        <div className="gold-divider mt-10 mb-16 max-w-xs mx-auto">
          <span className="text-accent">✦</span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {/* Tienda */}
        <div className="text-center p-8 border border-primary/10 bg-surface">
          <div className="text-accent text-3xl mb-4">✦</div>
          <h2 className="font-display text-xl text-primary mb-3">Visítanos</h2>
          <p className="text-sm text-primary/70 leading-relaxed">
            Cra 48 # 75 - 51
            <br />
            Barranquilla, Atlántico
          </p>
        </div>

        {/* WhatsApp */}
        <div className="text-center p-8 border border-accent bg-ink text-surface">
          <div className="text-accent-light text-3xl mb-4">✦</div>
          <h2 className="font-display text-xl mb-3">WhatsApp</h2>
          <p className="text-sm text-muted/80 mb-4">Respuesta más rápida</p>
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-accent-light hover:text-accent-light transition-colors"
          >
            +57 322 451 3906
          </a>
        </div>

        {/* Email — formulario expandible */}
        <ContactForm />
      </div>

      <div className="mt-16 text-center text-sm text-primary/60">
        <p className="font-serif italic">
          Horario de atención · Lunes a sábado · 8:00 AM – 7:00 PM
        </p>
      </div>
    </div>
  );
}
