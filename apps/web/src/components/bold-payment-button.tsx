'use client';

import { useEffect, useRef } from 'react';
import type { BoldButtonConfig } from '@mvh/types';

const BOLD_SCRIPT_SRC = 'https://checkout.bold.co/library/boldPaymentButton.js';

/**
 * Renderiza el botón de pagos embebido de Bold.
 *
 * Bold expone una librería que se auto-inicializa al cargar y lee los `data-*`
 * de su propio <script>. Inyectamos ese script (con la config firmada en el
 * servidor) dentro de un contenedor; al hacer clic, Bold abre su checkout y
 * al terminar redirige a `redirectionUrl`.
 */
export function BoldPaymentButton({ config }: { config: BoldButtonConfig }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Limpia render previo (p.ej. si cambia la config)
    container.innerHTML = '';

    const script = document.createElement('script');
    script.src = BOLD_SCRIPT_SRC;
    script.setAttribute('data-bold-button', 'dark-L');
    script.setAttribute('data-api-key', config.apiKey);
    script.setAttribute('data-order-id', config.orderReference);
    script.setAttribute('data-amount', String(config.amount));
    script.setAttribute('data-currency', config.currency);
    script.setAttribute('data-integrity-signature', config.integritySignature);
    script.setAttribute('data-description', config.description);
    script.setAttribute('data-redirection-url', config.redirectionUrl);
    if (config.customerData) script.setAttribute('data-customer-data', config.customerData);

    container.appendChild(script);

    return () => {
      container.innerHTML = '';
    };
  }, [config]);

  return <div ref={containerRef} className="flex justify-center" />;
}
