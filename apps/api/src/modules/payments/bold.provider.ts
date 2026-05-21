import crypto from 'node:crypto';
import { env } from '../../config/env';
import type {
  PaymentProvider,
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentStatusResult,
  WebhookVerifyInput,
  WebhookVerifyResult,
} from './payment-provider.interface';
import { InternalError } from '../../lib/errors';

// Bold Colombia API — https://bold.co/developers
// Docs: https://developers.bold.co/online-payments
const BOLD_BASE_URL =
  env.BOLD_ENVIRONMENT === 'production'
    ? 'https://integrations.api.bold.co'
    : 'https://sandbox.api.bold.co';

// Bold maps their payment statuses to our internal PaymentStatus
const BOLD_STATUS_MAP: Record<string, PaymentStatusResult['status']> = {
  PENDING: 'PENDING',
  AUTHORIZED: 'AUTHORIZED',
  APPROVED: 'APPROVED',
  DECLINED: 'REJECTED',
  REJECTED: 'REJECTED',
  FAILED: 'FAILED',
  VOIDED: 'FAILED',
  REFUNDED: 'REFUNDED',
  PARTIAL_REFUND: 'REFUNDED',
};

export class BoldPaymentProvider implements PaymentProvider {
  readonly name = 'bold';

  private get apiKey(): string {
    if (!env.BOLD_SECRET_KEY) throw new InternalError('BOLD_SECRET_KEY no configurado');
    return env.BOLD_SECRET_KEY;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${BOLD_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `x-api-key ${this.apiKey}`,
        ...options.headers,
      },
    });

    const json = (await res.json()) as T & { error?: unknown };
    if (!res.ok) {
      throw new InternalError(`Bold API error ${res.status}: ${JSON.stringify(json)}`);
    }
    return json;
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    // Bold payment link creation
    // Ref: https://developers.bold.co/online-payments/payment-link
    const body = {
      amount: {
        currency: input.currency,
        total_amount: input.amountCents, // Bold uses cents (pesos sin decimales = centavos)
      },
      description: `Pedido ${input.orderNumber} — MVH Flores`,
      redirect_urls: {
        return_url: input.returnUrl,
        cancel_url: input.cancelUrl,
      },
      customer: {
        email: input.customer.email,
        full_name: `${input.customer.firstName} ${input.customer.lastName}`.trim(),
        phone: input.customer.phone,
      },
      metadata: {
        order_id: input.orderId,
        order_number: input.orderNumber,
      },
    };

    const response = await this.request<{
      payload: { payment_link: string; bold_api_order_id?: string };
    }>('/online_payments/v2/payment-link', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return {
      providerPaymentId: response.payload.bold_api_order_id ?? input.orderId,
      redirectUrl: response.payload.payment_link,
      raw: response,
    };
  }

  async getPaymentStatus(providerPaymentId: string): Promise<PaymentStatusResult> {
    const response = await this.request<{
      payload: { status: string; order_id?: string };
    }>(`/online_payments/v2/orders/${providerPaymentId}`);

    const status = BOLD_STATUS_MAP[response.payload.status] ?? 'PENDING';
    return { status, providerReference: response.payload.order_id, raw: response };
  }

  async verifyWebhook(input: WebhookVerifyInput): Promise<WebhookVerifyResult> {
    if (!env.BOLD_WEBHOOK_SECRET) {
      return { isValid: false, raw: null };
    }

    // Bold webhook signature: HMAC-SHA256(rawBody, webhookSecret) in hex
    const signature =
      (input.headers['x-bold-signature'] as string) ??
      (input.headers['x-payment-signature'] as string);

    if (!signature) return { isValid: false, raw: null };

    const expected = crypto
      .createHmac('sha256', env.BOLD_WEBHOOK_SECRET)
      .update(input.rawBody)
      .digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expected, 'hex'),
    );

    if (!isValid) return { isValid: false, raw: null };

    // Parse payload
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(input.rawBody) as Record<string, unknown>;
    } catch {
      return { isValid: false, raw: null };
    }

    const eventType = payload.type as string | undefined;
    const data = payload.data as Record<string, unknown> | undefined;
    const transaction = data?.transaction as Record<string, unknown> | undefined;
    const providerPaymentId = transaction?.id as string | undefined;
    const boldStatus = transaction?.status as string | undefined;
    const status = boldStatus ? (BOLD_STATUS_MAP[boldStatus] ?? 'PENDING') : undefined;

    // Only mark approved if it's an APPROVED event
    const approvedEvents = ['PAYMENT_APPROVED', 'TRANSACTION_APPROVED'];
    if (eventType && !approvedEvents.includes(eventType) && status === 'APPROVED') {
      return { isValid: true, providerPaymentId, status: 'PENDING', raw: payload };
    }

    return { isValid: true, providerPaymentId, status, raw: payload };
  }
}
