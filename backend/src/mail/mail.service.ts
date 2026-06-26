// EN: Mail service: sends contact-form emails via SMTP (nodemailer), logging only when SMTP is unset.
// ES: Servicio de correo: envía emails del formulario de contacto por SMTP (nodemailer), solo registra si no hay SMTP.
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

// EN: Injectable mail service that lazily builds the SMTP transporter from env vars.
// ES: Servicio de correo inyectable que construye el transporte SMTP a partir de variables de entorno.
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user, pass },
      });
    } else {
      this.logger.warn('SMTP not configured — contact form emails will be logged only');
    }
  }

  // EN: Sends a contact-form email (or logs it if SMTP is not configured).
  // ES: Envía un email del formulario de contacto (o lo registra si SMTP no está configurado).
  async sendContact(opts: {
    fromName: string;
    fromEmail: string;
    message: string;
  }): Promise<void> {
    const to = process.env.CONTACT_TO ?? 'web@elpactoclub.com';
    const from = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? 'noreply@elpactoclub.com';
    const subject = `Colaboración El Pacto BC — ${opts.fromName}`;
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9f9f9;border-radius:8px;">
        <h2 style="color:#111;margin-top:0;">Nuevo mensaje de colaboración</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
          <tr><td style="padding:8px 0;font-weight:700;color:#555;width:100px;">Nombre</td><td style="padding:8px 0;">${opts.fromName}</td></tr>
          <tr><td style="padding:8px 0;font-weight:700;color:#555;">Email</td><td style="padding:8px 0;"><a href="mailto:${opts.fromEmail}">${opts.fromEmail}</a></td></tr>
        </table>
        <div style="background:#fff;border-left:4px solid #F0E040;padding:16px;border-radius:4px;white-space:pre-wrap;color:#333;">${opts.message}</div>
        <p style="margin-top:20px;font-size:12px;color:#999;">Enviado desde el formulario de El Pacto BC · elpactoclub.com</p>
      </div>
    `;

    if (!this.transporter) {
      this.logger.log(`[CONTACT] To: ${to} | From: ${opts.fromEmail} | Subject: ${subject}`);
      this.logger.log(`[CONTACT] Message: ${opts.message}`);
      return;
    }

    await this.transporter.sendMail({ from, to, replyTo: opts.fromEmail, subject, html });
    this.logger.log(`Contact email sent to ${to} from ${opts.fromEmail}`);
  }
}
