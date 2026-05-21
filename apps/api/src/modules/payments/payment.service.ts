import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../lib/errors';
import { BoldPaymentProvider } from './bold.provider';
import type { InitiatePaymentInput } from './payment.schemas';
import type { WebhookVerifyInput } from './payment-provider.interface';
import { logger } from '../../config/logger';

const boldProvider = new BoldPaymentProvider();

export const paymentService = {
  async initiatePayment(orderId: string, input: InitiatePaymentInput, userId?: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundError('Pedido no encontrado');
    if (userId && order.userId && order.userId !== userId) throw new ForbiddenError();
    if (order.status !== 'PENDING') {
      throw new BadRequestError(`El pedido ya tiene estado "${order.status}" y no puede pagarse`);
    }

    // Cash on delivery — mark immediately
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
      return {
        paymentId: payment.id,
        redirectUrl: null,
        provider: 'cash',
      };
    }

    // Bold payment
    const customerEmail =
      order.guestEmail ??
      (order.userId
        ? (await prisma.user.findUnique({ where: { id: order.userId }, select: { email: true } }))
            ?.email
        : null) ??
      'cliente@mvhflores.com';

    const returnUrl =
      input.returnUrl ?? `${env.API_BASE_URL.replace(':4000', ':3000')}/pedido/${orderId}?status=success`;
    const cancelUrl =
      input.cancelUrl ?? `${env.API_BASE_URL.replace(':4000', ':3000')}/pedido/${orderId}?status=cancelled`;

    const result = await boldProvider.createPayment({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amountCents: order.totalCents,
      currency: order.currency,
      customer: {
        email: customerEmail,
        firstName: order.guestFirstName ?? 'Cliente',
        lastName: order.guestLastName ?? 'MVH',
        phone: order.guestPhone ?? undefined,
      },
      returnUrl,
      cancelUrl,
    });

    await prisma.payment.create({
      data: {
        orderId,
        provider: 'bold',
        method: input.method,
        status: 'PENDING',
        amountCents: order.totalCents,
        currency: order.currency,
        providerPaymentId: result.providerPaymentId,
        rawResponse: result.raw as object,
      },
    });

    return {
      paymentId: result.providerPaymentId,
      redirectUrl: result.redirectUrl ?? null,
      provider: 'bold',
    };
  },

  async handleWebhook(rawBody: string, headers: Record<string, string | string[] | undefined>) {
    const verifyInput: WebhookVerifyInput = { rawBody, headers };
    const result = await boldProvider.verifyWebhook(verifyInput);

    if (!result.isValid) {
      logger.warn('Bold webhook signature inválida');
      return { received: false };
    }

    const { providerPaymentId, status, raw } = result;
    if (!providerPaymentId || !status) return { received: true };

    const payment = await prisma.payment.findFirst({
      where: { providerPaymentId },
      include: { order: true },
    });
    if (!payment) {
      logger.warn({ providerPaymentId }, 'Bold webhook: pago no encontrado');
      return { received: true };
    }

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status,
          rawResponse: raw as object,
          paidAt: status === 'APPROVED' ? new Date() : undefined,
        },
      });

      if (status === 'APPROVED' && payment.order.status === 'PENDING') {
        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: 'PAID' },
        });
        await tx.orderStatusHistory.create({
          data: {
            orderId: payment.orderId,
            fromStatus: 'PENDING',
            toStatus: 'PAID',
            note: `Pago confirmado por Bold (${providerPaymentId})`,
          },
        });
      }

      if ((status === 'REJECTED' || status === 'FAILED') && payment.order.status === 'PENDING') {
        await tx.order.update({ where: { id: payment.orderId }, data: { status: 'CANCELLED' } });
        await tx.orderStatusHistory.create({
          data: {
            orderId: payment.orderId,
            fromStatus: 'PENDING',
            toStatus: 'CANCELLED',
            note: `Pago rechazado por Bold (${providerPaymentId})`,
          },
        });
      }
    });

    logger.info({ providerPaymentId, status }, 'Bold webhook procesado');
    return { received: true };
  },
};
