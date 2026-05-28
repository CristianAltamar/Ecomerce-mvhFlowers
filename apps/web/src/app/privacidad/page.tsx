import type { Metadata } from 'next';
import { apiFetch } from '@/lib/api-client';

export const metadata: Metadata = {
  title: 'Política de privacidad',
  description: 'Conoce cómo MVH Flores recopila, usa y protege tu información personal.',
};

const DEFAULT_HTML = `
<h2>Política de Privacidad</h2>
<p><em>Última actualización: 2025</em></p>
<p>En <strong>Floristería MVH Flores</strong> (en adelante "MVH", "nosotros" o "la empresa"), respetamos tu privacidad y nos comprometemos a proteger tus datos personales de acuerdo con la <strong>Ley 1581 de 2012</strong> (Ley de Protección de Datos Personales de Colombia) y el Decreto 1377 de 2013.</p>

<h3>1. Responsable del tratamiento</h3>
<p>Floristería MVH Flores · Cra 48 # 75–51, Barranquilla, Atlántico, Colombia · <a href="mailto:mvhflowersshop@gmail.com">mvhflowersshop@gmail.com</a></p>

<h3>2. Datos que recopilamos</h3>
<ul>
  <li><strong>Datos de identificación:</strong> nombre, apellidos, número de teléfono, correo electrónico.</li>
  <li><strong>Datos de entrega:</strong> dirección, barrio, ciudad, referencias de acceso.</li>
  <li><strong>Datos de pago:</strong> procesados de forma segura por nuestro proveedor de pagos (Bold). MVH no almacena datos de tarjetas.</li>
  <li><strong>Datos de navegación:</strong> dirección IP, tipo de navegador, páginas visitadas (con fines estadísticos).</li>
</ul>

<h3>3. Finalidad del tratamiento</h3>
<ul>
  <li>Procesar y entregar tus pedidos.</li>
  <li>Enviarte confirmaciones y actualizaciones sobre tu pedido.</li>
  <li>Atender solicitudes de soporte o reclamaciones.</li>
  <li>Mejorar nuestros servicios y experiencia de usuario.</li>
  <li>Cumplir obligaciones legales y fiscales.</li>
</ul>

<h3>4. Compartición de datos</h3>
<p>No vendemos ni cedemos tus datos a terceros con fines comerciales. Podemos compartirlos únicamente con:</p>
<ul>
  <li>Proveedores de servicios que nos ayudan a operar la tienda (pasarela de pago, servicio de email).</li>
  <li>Autoridades competentes cuando sea exigido por ley.</li>
</ul>

<h3>5. Derechos del titular</h3>
<p>De acuerdo con la Ley 1581 de 2012, tienes derecho a:</p>
<ul>
  <li>Conocer, actualizar y rectificar tus datos personales.</li>
  <li>Solicitar la supresión de tus datos cuando no sean necesarios para las finalidades declaradas.</li>
  <li>Revocar la autorización de tratamiento en cualquier momento.</li>
  <li>Presentar quejas ante la Superintendencia de Industria y Comercio (SIC).</li>
</ul>
<p>Para ejercer estos derechos, escríbenos a <a href="mailto:mvhflowersshop@gmail.com">mvhflowersshop@gmail.com</a>.</p>

<h3>6. Seguridad</h3>
<p>Implementamos medidas técnicas y organizativas razonables para proteger tus datos contra accesos no autorizados, pérdida o divulgación.</p>

<h3>7. Cambios a esta política</h3>
<p>Nos reservamos el derecho de actualizar esta política. Los cambios se publicarán en esta página con la fecha de última actualización.</p>
`;

async function getContent(): Promise<string> {
  try {
    const data = await apiFetch<{ key: string; content: string }>('/site-content/privacidad', {
      revalidate: 3600,
    });
    return data.content || DEFAULT_HTML;
  } catch {
    return DEFAULT_HTML;
  }
}

export default async function PrivacidadPage() {
  const content = await getContent();

  return (
    <div className="container-mvh py-16 lg:py-24">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="eyebrow mb-4">MVH Flores</p>
          <h1 className="font-display text-5xl lg:text-6xl text-primary">
            Política de privacidad
          </h1>
          <div className="gold-divider mt-8 max-w-xs mx-auto">
            <span className="text-accent">✦</span>
          </div>
        </div>

        <article
          className="prose-mvh"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </div>
  );
}
