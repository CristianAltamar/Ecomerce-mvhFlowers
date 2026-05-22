import { Worker } from 'bullmq';
import nodemailer from 'nodemailer';
import { createBullMQConnection } from '../config/redis';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { formatCOP } from '@mvh/utils';
import type { EmailJobData } from './email.queue';

function createTransporter() {
  if (!env.SMTP_HOST) {
    // Dev: Ethereal fake SMTP (logs to console, no real emails sent)
    return nodemailer.createTransport({
      host: 'localhost',
      port: 1025,
      ignoreTLS: true,
    });
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });
}

function renderOrderConfirmationHtml(payload: Extract<EmailJobData, { type: 'order_confirmation' }>['payload']): string {
  const rows = payload.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0;border-bottom:1px solid #f0e8de">${i.productName}</td>
         <td style="padding:6px 0;border-bottom:1px solid #f0e8de;text-align:center">${i.quantity}</td>
         <td style="padding:6px 0;border-bottom:1px solid #f0e8de;text-align:right">${formatCOP(i.unitPriceCents * i.quantity)}</td></tr>`,
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Confirmación de pedido</title></head>
<body style="font-family:Georgia,serif;background:#faf7f4;margin:0;padding:24px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,.06)">
    <h1 style="font-size:22px;color:#6b1d2a;margin:0 0 4px">MVH Flores</h1>
    <p style="color:#888;font-size:13px;margin:0 0 24px">Barranquilla, Colombia</p>

    <p style="font-size:16px;color:#333">Hola ${payload.customerName},</p>
    <p style="color:#555">Tu pedido <strong>${payload.orderNumber}</strong> fue recibido con éxito.</p>

    <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px">
      <thead>
        <tr style="border-bottom:2px solid #6b1d2a">
          <th style="text-align:left;padding:6px 0;color:#6b1d2a">Producto</th>
          <th style="text-align:center;padding:6px 0;color:#6b1d2a">Cant.</th>
          <th style="text-align:right;padding:6px 0;color:#6b1d2a">Subtotal</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <p style="font-size:16px;font-weight:bold;text-align:right;color:#6b1d2a">
      Total: ${formatCOP(payload.totalCents)}
    </p>

    <p style="color:#555;font-size:14px">
      <strong>Fecha de entrega:</strong> ${payload.deliveryDate}
    </p>

    <hr style="border:none;border-top:1px solid #f0e8de;margin:24px 0">
    <p style="font-size:12px;color:#aaa;text-align:center">
      MVH Flores · Barranquilla, Colombia · hola@mvhflores.co
    </p>
  </div>
</body>
</html>`;
}

export function startEmailWorker(): Worker | null {
  const conn = createBullMQConnection();
  if (!conn) {
    logger.warn('Redis no configurado — email worker no iniciado');
    return null;
  }

  const transporter = createTransporter();

  const worker = new Worker<EmailJobData>(
    'emails',
    async (job) => {
      const { type, payload } = job.data;

      if (type === 'order_confirmation') {
        await transporter.sendMail({
          from: env.SMTP_FROM,
          to: payload.customerEmail,
          subject: `✅ Pedido ${payload.orderNumber} confirmado — MVH Flores`,
          html: renderOrderConfirmationHtml(payload),
        });
        logger.info({ orderNumber: payload.orderNumber }, 'Email de confirmación enviado');
      }

      if (type === 'order_status_changed') {
        await transporter.sendMail({
          from: env.SMTP_FROM,
          to: payload.customerEmail,
          subject: `Tu pedido ${payload.orderNumber} fue actualizado — MVH Flores`,
          html: `<p>Hola ${payload.customerName}, tu pedido <strong>${payload.orderNumber}</strong> está ahora en estado <strong>${payload.newStatus}</strong>.</p>`,
        });
        logger.info({ orderNumber: payload.orderNumber, status: payload.newStatus }, 'Email de estado enviado');
      }
    },
    { connection: conn, concurrency: 3 },
  );

  worker.on('completed', (job) => logger.debug({ jobId: job.id }, 'Email job completado'));
  worker.on('failed', (job, err) => logger.error({ jobId: job?.id, err }, 'Email job fallido'));

  logger.info('📬 Email worker iniciado');
  return worker;
}
