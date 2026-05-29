import crypto from 'node:crypto';
import { env, isProduction } from '../../config/env';
import { logger } from '../../config/logger';
import { InternalError } from '../../lib/errors';
import type {
  PaymentProvider,
  BuildPaymentInput,
  BoldButtonConfig,
  WebhookVerifyInput,
  WebhookVerifyResult,
  PaymentStatus,
} from './payment-provider.interface';

// Bold Colombia — Botón de pagos: https://developers.bold.co/pagos-en-linea/boton-de-pagos
//
// Flujo:
//  1. El servidor calcula la firma de integridad: SHA256(`${ref}${amount}${currency}${secret}`).
//  2. El front renderiza el botón con la llave de identidad (pública) + la firma.
//  3. Bold cobra y redirige a `redirection_url`; además notifica por webhook.

// Eventos de webhook de Bold → PaymentStatus interno
const BOLD_EVENT_STATUS: Record<string, PaymentStatus> = {
  SALE_APPROVED: 'APPROVED',
  SALE_REJECTED: 'REJECTED',
  VOID_APPROVED: 'REFUNDED',
  // VOID_REJECTED no cambia el estado del pedido
};

export class BoldPaymentProvider implements PaymentProvider {
  readonly name = 'bold';

  private get identityKey(): string {
    if (!env.BOLD_API_KEY) throw new InternalError('BOLD_API_KEY (llave de identidad) no configurada');
    return env.BOLD_API_KEY;
  }

  private get secretKey(): string {
    if (!env.BOLD_SECRET_KEY) throw new InternalError('BOLD_SECRET_KEY (llave secreta) no configurada');
    return env.BOLD_SECRET_KEY;
  }

  /** Firma de integridad: SHA256(referencia + monto + divisa + llaveSecreta) en hex. */
  private integritySignature(reference: string, amount: number, currency: string): string {
    const chain = `${reference}${amount}${currency}${this.secretKey}`;
    return crypto.createHash('sha256').update(chain, 'utf8').digest('hex');
  }

  buildButtonConfig(input: BuildPaymentInput): BoldButtonConfig {
    const customerData = JSON.stringify({
      email: input.customer.email,
      fullName: `${input.customer.firstName} ${input.customer.lastName}`.trim(),
      phone: input.customer.phone ?? '',
    });

    return {
      apiKey: this.identityKey,
      orderReference: input.reference,
      amount: input.amountCents,
      currency: input.currency,
      integritySignature: this.integritySignature(input.reference, input.amountCents, input.currency),
      description: input.description,
      redirectionUrl: input.redirectionUrl,
      customerData,
    };
  }

  verifyWebhook(input: WebhookVerifyInput): WebhookVerifyResult {
    // Parseo del payload (CloudEvents-like): { type, data: { payment_id, metadata: { reference } } }
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(input.rawBody) as Record<string, unknown>;
    } catch {
      return { isValid: false, raw: null };
    }

    const data = (payload.data ?? {}) as Record<string, unknown>;
    const metadata = (data.metadata ?? {}) as Record<string, unknown>;
    const payment = (data.payment ?? {}) as Record<string, unknown>;
    const eventType = payload.type as string | undefined;

    const reference =
      (metadata.reference as string | undefined) ??
      (payment.reference as string | undefined) ??
      (data.reference as string | undefined);
    const providerPaymentId =
      (data.payment_id as string | undefined) ??
      (payment.id as string | undefined) ??
      (data.id as string | undefined);
    const status = eventType ? BOLD_EVENT_STATUS[eventType] : undefined;

    // Escape solo-sandbox: permite probar el flujo mientras se afina el esquema de firma.
    if (env.BOLD_WEBHOOK_SKIP_VERIFY && !isProduction) {
      logger.warn('Bold webhook: verificación de firma OMITIDA (BOLD_WEBHOOK_SKIP_VERIFY, no-producción)');
      return { isValid: true, reference, providerPaymentId, status, raw: payload };
    }

    const secret = env.BOLD_WEBHOOK_SECRET ?? env.BOLD_SECRET_KEY;
    if (!secret) {
      logger.error('Bold webhook: no hay llave para verificar la firma');
      return { isValid: false, raw: payload };
    }

    const provided =
      (input.headers['x-bold-signature'] as string | undefined) ??
      (input.headers['x-payment-signature'] as string | undefined);
    if (!provided) {
      logger.warn('Bold webhook: falta el header x-bold-signature');
      return { isValid: false, raw: payload };
    }

    // Bold firma con HMAC-SHA256 usando la llave secreta. Aceptamos las variantes documentadas
    // (cuerpo crudo o en base64; salida hex o base64) para robustez ante cambios de formato.
    const b64Body = Buffer.from(input.rawBody, 'utf8').toString('base64');
    const candidates = [input.rawBody, b64Body].flatMap((msg) => {
      const digest = crypto.createHmac('sha256', secret).update(msg, 'utf8').digest();
      return [digest.toString('hex'), digest.toString('base64')];
    });

    const isValid = candidates.some((expected) => {
      if (expected.length !== provided.length) return false;
      try {
        return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
      } catch {
        return false;
      }
    });

    if (!isValid) {
      logger.warn({ provided }, 'Bold webhook: firma inválida');
      return { isValid: false, raw: payload };
    }

    return { isValid: true, reference, providerPaymentId, status, raw: payload };
  }
}
