import type {
  PaymentProvider,
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentStatusResult,
  WebhookVerifyInput,
  WebhookVerifyResult,
} from './payment-provider.interface';

/**
 * Stub de BoldPaymentProvider.
 *
 * Implementación completa en Entrega 2:
 *   - Crear link de pago vía API de Bold
 *   - Validar webhook con HMAC + BOLD_WEBHOOK_SECRET
 *   - Mapear estados de Bold a nuestro PaymentStatus
 *   - Manejar reintentos y timeouts
 *
 * Por ahora lanza errores para que sea evidente que está pendiente
 * y nadie lo use accidentalmente en producción.
 */
export class BoldPaymentProvider implements PaymentProvider {
  readonly name = 'bold';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async createPayment(_input: CreatePaymentInput): Promise<CreatePaymentResult> {
    throw new Error('BoldPaymentProvider.createPayment: pendiente de implementación (Entrega 2)');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getPaymentStatus(_providerPaymentId: string): Promise<PaymentStatusResult> {
    throw new Error('BoldPaymentProvider.getPaymentStatus: pendiente de implementación (Entrega 2)');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async verifyWebhook(_input: WebhookVerifyInput): Promise<WebhookVerifyResult> {
    throw new Error('BoldPaymentProvider.verifyWebhook: pendiente de implementación (Entrega 2)');
  }
}
