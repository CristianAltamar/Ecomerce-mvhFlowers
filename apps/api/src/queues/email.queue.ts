import { Queue } from 'bullmq';
import { createBullMQConnection } from '../config/redis';
import { logger } from '../config/logger';

export type OrderConfirmationPayload = {
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  total: number;
  deliveryDate: string;
  items: Array<{ productName: string; quantity: number; unitPrice: number }>;
};

export type OrderStatusChangedPayload = {
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  newStatus: string;
};

export type EmailJobData =
  | { type: 'order_confirmation'; payload: OrderConfirmationPayload }
  | { type: 'order_status_changed'; payload: OrderStatusChangedPayload };

let emailQueue: Queue<EmailJobData> | null = null;

export function getEmailQueue(): Queue<EmailJobData> | null {
  if (!emailQueue) {
    const conn = createBullMQConnection();
    if (!conn) return null;

    emailQueue = new Queue<EmailJobData>('emails', {
      connection: conn,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    });
    logger.info('📬 Email queue inicializada');
  }

  return emailQueue ?? null;
}

export async function enqueueOrderConfirmation(payload: OrderConfirmationPayload): Promise<void> {
  const queue = getEmailQueue();
  if (!queue) return;
  await queue.add('order_confirmation', { type: 'order_confirmation', payload }, { priority: 1 });
}

export async function enqueueStatusChanged(payload: OrderStatusChangedPayload): Promise<void> {
  const queue = getEmailQueue();
  if (!queue) return;
  await queue.add('order_status_changed', { type: 'order_status_changed', payload });
}