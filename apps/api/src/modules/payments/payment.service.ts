import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../lib/errors';
import { BoldPaymentProvider } from './bold.provider';
import type { InitiatePaymentInput } from './payment.schemas';
import type { BoldButtonConfig } from './payment-provider.interface';
import { logger } from '../../config/logger';
import { enqueueStatusChanged } from '../../queues/email.queue';

const boldProvider = new BoldPaymentProvider();

interface InitiateResult {
  provider: 'bold' | 'cash';
  paymentId: string;
  bold: BoldButtonConfig | null;
}

export const paymentService = {
  async initiatePayment(
    orderId: string,
    input: InitiatePaymentInput,
    userId?: string,
  ): Promise<InitiateResult> {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundError('Pedido no encontrado');
    if (userId && order.userId && order.userId !== userId) throw new ForbiddenError();
    if (order.status !== 'PENDING') {
      throw new BadRequestError(`El pedido ya tiene estado "${order.status}" y no puede pagarse`);
    }

    // ── Contraentrega — se marca de inmediato ──────────────────────────────
    if (input.method === 'CASH_ON_DELIVERY') {
      const payment = await prisma.payment.create({
        data: {
          orderId,
          provider: 'cash',
          method: 'CASH_ON_DELIVERY',
          status: 'PENDING',
          amountCents: order.totalCents,
          currency: order.currency,
        },
      });
      return { provider: 'cash', paymentId: payment.id, bold: null };
    }

    // ── Bold — botón de pagos embebido ─────────────────────────────────────
    const customerEmail =
      order.guestEmail ??
      (order.userId
        ? (await prisma.user.findUnique({ where: { id: order.userId }, select: { email: true } }))
            ?.email
        : null) ??
      'cliente@mvhflores.com';

    // Referencia estable por pedido (idempotente ante reintentos del mismo pedido)
    const reference = order.orderNumber;
    const redirectionUrl = "https://mvhflores.vercel.app/pedido/" + orderId + "?status=success";
      //input.returnUrl ?? `${env.WEB_BASE_URL}/pedido/${orderId}?status=success`;

    const config = boldProvider.buildButtonConfig({
      orderId: order.id,
      reference,
      amountCents: order.totalCents,
      currency: order.currency,
      description: `Pedido ${order.orderNumber} — MVH Flores`,
      redirectionUrl,
      customer: {
        email: customerEmail,
        firstName: order.guestFirstName ?? 'Cliente',
        lastName: order.guestLastName ?? 'MVH',
        phone: order.guestPhone ?? undefined,
      },
    });

    // Reutiliza el pago Bold pendiente del pedido si ya existe (evita filas duplicadas)
    const existing = await prisma.payment.findFirst({
      where: { orderId, provider: 'bold', status: 'PENDING' },
    });
    const payment = existing
      ? await prisma.payment.update({
          where: { id: existing.id },
          data: {
            method: input.method,
            amountCents: order.totalCents,
            currency: order.currency,
            providerReference: reference,
            rawRequest: config as object,
          },
        })
      : await prisma.payment.create({
          data: {
            orderId,
            provider: 'bold',
            method: input.method,
            status: 'PENDING',
            amountCents: order.totalCents,
            currency: order.currency,
            providerReference: reference,
            rawRequest: config as object,
          },
        });

    return { provider: 'bold', paymentId: payment.id, bold: config };
  },

  async handleWebhook(rawBody: string, headers: Record<string, string | string[] | undefined>) {
    const result = boldProvider.verifyWebhook({ rawBody, headers });

    if (!result.isValid) {
      logger.warn('Bold webhook: payload o firma inválidos');
      return { received: false };
    }

    const { reference, providerPaymentId, status, raw } = result;
    if (!reference || !status) {
      logger.info({ reference, status }, 'Bold webhook: evento sin acción');
      return { received: true };
    }

    const payment = await prisma.payment.findFirst({
      where: { providerReference: reference, provider: 'bold' },
      include: { order: true },
      orderBy: { createdAt: 'desc' },
    });
    if (!payment) {
      logger.warn({ reference }, 'Bold webhook: pago no encontrado');
      return { received: true };
    }

    const transitioned = await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status,
          providerPaymentId: providerPaymentId ?? payment.providerPaymentId,
          rawResponse: raw as object,
          paidAt: status === 'APPROVED' ? new Date() : undefined,
        },
      });

      if (status === 'APPROVED' && payment.order.status === 'PENDING') {
        await tx.order.update({ where: { id: payment.orderId }, data: { status: 'PAID' } });
        await tx.orderStatusHistory.create({
          data: {
            orderId: payment.orderId,
            fromStatus: 'PENDING',
            toStatus: 'PAID',
            note: `Pago confirmado por Bold (${providerPaymentId ?? reference})`,
          },
        });
        return 'PAID' as const;
      }

      if ((status === 'REJECTED' || status === 'FAILED') && payment.order.status === 'PENDING') {
        await tx.order.update({ where: { id: payment.orderId }, data: { status: 'CANCELLED' } });
        await tx.orderStatusHistory.create({
          data: {
            orderId: payment.orderId,
            fromStatus: 'PENDING',
            toStatus: 'CANCELLED',
            note: `Pago rechazado por Bold (${providerPaymentId ?? reference})`,
          },
        });
        return 'CANCELLED' as const;
      }

      return null;
    });

    // Notificación por email del cambio de estado (best-effort, no bloquea el webhook)
    if (transitioned === 'PAID') {
      const customerEmail =
        payment.order.guestEmail ??
        (payment.order.userId
          ? (
              await prisma.user.findUnique({
                where: { id: payment.order.userId },
                select: { email: true },
              })
            )?.email
          : null);
      if (customerEmail) {
        const customerName =
          `${payment.order.guestFirstName ?? ''} ${payment.order.guestLastName ?? ''}`.trim() ||
          'Cliente';
        await enqueueStatusChanged({
          orderId: payment.orderId,
          orderNumber: payment.order.orderNumber,
          customerEmail,
          customerName,
          newStatus: 'PAID',
        }).catch((err) => logger.error({ err }, 'No se pudo encolar email de pago'));
      }
    }

    logger.info({ reference, status }, 'Bold webhook procesado');
    return { received: true };
  },
};
