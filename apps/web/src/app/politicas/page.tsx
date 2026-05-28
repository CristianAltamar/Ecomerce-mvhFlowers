import type { Metadata } from 'next';
import { apiFetch } from '@/lib/api-client';

export const metadata: Metadata = {
  title: 'Políticas de venta',
  description: 'Garantía de calidad, política de devoluciones, condiciones de entrega y cancelación de Floristería MVH Flores.',
};

const DEFAULT_HTML = `
<h2>Política de devolución y reembolso</h2>
<p>Estimado cliente, en Floristería MVH nos esmeramos por ofrecerle la mejor calidad y servicio en cada uno de nuestros productos. A continuación, detallamos nuestra política de ventas y condiciones para reclamaciones:</p>

<h3>1. Garantía de Calidad</h3>
<p>Todas nuestras flores y arreglos están cuidadosamente seleccionados para asegurar su frescura y calidad. Si por alguna razón el producto no cumple con nuestras normas de calidad, estaremos encantados de atender su solicitud de cambio.</p>

<h3>2. Reclamaciones y Cambios</h3>
<p>Las reclamaciones y solicitudes de cambio deberán realizarse dentro de un plazo máximo de <strong>12 horas</strong> a partir de la entrega del producto.</p>
<p>Para iniciar una reclamación, el cliente debe comunicarse con nuestro servicio de atención al cliente por teléfono o correo electrónico, proporcionando detalles del pedido y las razones de la reclamación.</p>
<p>En caso de que la reclamación sea aceptada, ofrecemos la opción de reemplazo del producto o un crédito para futuras compras.</p>

<h3>3. Condiciones Aplicables</h3>
<ul>
  <li>El producto debe encontrarse en las condiciones originales en las que fue entregado.</li>
  <li>No se aceptarán reclamaciones por daños causados por mal manejo o condiciones ambientales adversas una vez entregado el producto.</li>
</ul>

<h3>4. Entregas</h3>
<p>Asegúrese de proporcionar una dirección completa y correcta para la entrega. Floristería MVH no se hace responsable de entregas fallidas debido a información incorrecta proporcionada por el cliente.</p>

<h3>5. Cancelaciones</h3>
<p>Las cancelaciones pueden realizarse sin cargo adicional si se solicitan al menos <strong>24 horas antes</strong> de la fecha de entrega programada.</p>

<p>Agradecemos su preferencia y estamos comprometidos a asegurarnos de que cada experiencia con nosotros sea satisfactoria. Para cualquier consulta adicional, no dude en <a href="/contacto">contactarnos</a>.</p>
`;

async function getContent(): Promise<string> {
  try {
    const data = await apiFetch<{ key: string; content: string }>('/site-content/politicas', {
      revalidate: 3600,
    });
    return data.content || DEFAULT_HTML;
  } catch {
    return DEFAULT_HTML;
  }
}

export default async function PoliticasPage() {
  const content = await getContent();

  return (
    <div className="container-mvh py-16 lg:py-24">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="eyebrow mb-4">MVH Flores</p>
          <h1 className="font-display text-5xl lg:text-6xl text-primary">
            Políticas de venta
          </h1>
          <div className="gold-divider mt-8 max-w-xs mx-auto">
            <span className="text-accent">✦</span>
          </div>
        </div>

        {/* Contenido */}
        <article
          className="prose-mvh"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </div>
  );
}
