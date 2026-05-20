/**
 * Interfaz abstracta de proveedor de pagos.
 *
 * El backend NUNCA debe acoplarse directamente a Bold u otra pasarela.
 * Todos los flujos de pago consumen esta interfaz, y la implementación
 * concreta se inyecta. Esto permite cambiar de proveedor sin tocar lógica
 * de checkout, órdenes ni notificaciones.
 *
 * Implementaciones planeadas:
 *   - BoldPaymentProvider     (Entrega 2 — pasarela principal)
 *   - CashOnDeliveryProvider  (Entrega 2 — contraentrega)
 *   - MockPaymentProvider     (testing)
 */

export interface CreatePaymentInput {
  orderId: string;
  orderNumber: string;
  amountCents: number;
  currency: string;
  customer: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  returnUrl: string;
  cancelUrl: string;
}

export interface CreatePaymentResult {
  providerPaymentId: string;
  redirectUrl?: string;
  raw: unknown;
}

export interface PaymentStatusResult {
  status: 'PENDING' | 'AUTHORIZED' | 'APPROVED' | 'REJECTED' | 'FAILED' | 'REFUNDED';
  providerReference?: string;
  raw: unknown;
}

export interface WebhookVerifyInput {
  rawBody: string;
  headers: Record<string, string | string[] | undefined>;
}

export interface WebhookVerifyResult {
  isValid: boolean;
  providerPaymentId?: string;
  status?: PaymentStatusResult['status'];
  raw: unknown;
}

export interface PaymentProvider {
  name: string;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  getPaymentStatus(providerPaymentId: string): Promise<PaymentStatusResult>;
  verifyWebhook(input: WebhookVerifyInput): Promise<WebhookVerifyResult>;
}
