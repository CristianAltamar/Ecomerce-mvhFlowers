/**
 * Interfaz abstracta de proveedor de pagos.
 *
 * El backend NUNCA debe acoplarse directamente a Bold u otra pasarela.
 * Todos los flujos de pago consumen esta interfaz, y la implementación
 * concreta se inyecta. Esto permite cambiar de proveedor sin tocar lógica
 * de checkout, órdenes ni notificaciones.
 *
 * Implementaciones:
 *   - BoldPaymentProvider     (pasarela principal — botón embebido + firma)
 *   - (contraentrega y mock se manejan en payment.service)
 */

export interface BuildPaymentInput {
  orderId: string;
  reference: string; // identificador único que se envía a Bold (data-order-id)
  amount: number; // entero (COP sin decimales)
  currency: string;
  description: string;
  redirectionUrl: string;
  customer: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
}

/**
 * Configuración que el frontend necesita para renderizar el botón de pagos de Bold.
 * `apiKey` es la llave de IDENTIDAD (pública); la firma se calcula en el servidor
 * con la llave secreta y NUNCA se expone.
 */
export interface BoldButtonConfig {
  apiKey: string;
  orderReference: string;
  amount: number;
  currency: string;
  integritySignature: string;
  description: string;
  redirectionUrl: string;
  customerData?: string; // JSON string (email, fullName, phone)
}

export type PaymentStatus =
  | 'PENDING'
  | 'AUTHORIZED'
  | 'APPROVED'
  | 'REJECTED'
  | 'FAILED'
  | 'REFUNDED';

export interface WebhookVerifyInput {
  rawBody: string;
  headers: Record<string, string | string[] | undefined>;
}

export interface WebhookVerifyResult {
  isValid: boolean;
  reference?: string; // nuestra referencia (data-order-id) devuelta en metadata
  providerPaymentId?: string; // id de la transacción en Bold
  status?: PaymentStatus;
  raw: unknown;
}

export interface PaymentProvider {
  name: string;
  buildButtonConfig(input: BuildPaymentInput): BoldButtonConfig;
  verifyWebhook(input: WebhookVerifyInput): WebhookVerifyResult;
}
