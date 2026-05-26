import { Router, type Request, type Response } from 'express';
import nodemailer from 'nodemailer';
import { z } from 'zod';
import { asyncHandler } from '../../lib/async-handler';
import { sendSuccess } from '../../lib/http';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { validate } from '../../middlewares/validate';

const router: Router = Router();

const contactSchema = z.object({
  nombre:  z.string().min(2).max(100),
  correo:  z.string().email(),
  asunto:  z.string().min(2).max(200),
  mensaje: z.string().min(10).max(3000),
});

function buildTransporter() {
  if (!env.SMTP_HOST) {
    return nodemailer.createTransport({ host: 'localhost', port: 1025, ignoreTLS: true });
  }
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });
}

/**
 * POST /contact
 * Envía el formulario de contacto al email de la tienda.
 * No requiere autenticación.
 */
router.post(
  '/',
  validate(contactSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { nombre, correo, asunto, mensaje } = req.body as z.infer<typeof contactSchema>;

    const transporter = buildTransporter();

    await transporter.sendMail({
      from: env.SMTP_FROM,
      to: env.SMTP_FROM,          // llega al email de la tienda
      replyTo: `${nombre} <${correo}>`,
      subject: `[Contacto] ${asunto}`,
      html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="font-family:Georgia,serif;background:#faf7f4;padding:24px;margin:0">
  <div style="max-width:520px;margin:0 auto;background:#fff;padding:32px;border-radius:8px;
              box-shadow:0 2px 8px rgba(0,0,0,.06)">
    <h2 style="color:#5a1028;margin:0 0 4px;font-size:20px">Nuevo mensaje de contacto</h2>
    <p style="color:#aaa;font-size:12px;margin:0 0 24px">MVH Flores · Barranquilla</p>

    <table style="width:100%;font-size:14px;border-collapse:collapse">
      <tr>
        <td style="padding:8px 0;color:#888;width:80px">Nombre</td>
        <td style="padding:8px 0;color:#333;font-weight:bold">${nombre}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#888">Correo</td>
        <td style="padding:8px 0">
          <a href="mailto:${correo}" style="color:#5a1028">${correo}</a>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#888">Asunto</td>
        <td style="padding:8px 0;color:#333">${asunto}</td>
      </tr>
    </table>

    <div style="margin:20px 0;padding:16px;background:#faf7f4;border-left:3px solid #d49328;
                font-size:14px;color:#333;line-height:1.7;white-space:pre-wrap">${mensaje}</div>

    <hr style="border:none;border-top:1px solid #f0e8de;margin:24px 0">
    <p style="font-size:11px;color:#bbb;text-align:center">
      Respondé directamente a este correo para contestar al cliente.
    </p>
  </div>
</body>
</html>`,
    });

    logger.info({ correo, asunto }, '📩 Formulario de contacto recibido');
    sendSuccess(res, { message: 'Mensaje enviado correctamente' });
  }),
);

export const contactRouter = router;
