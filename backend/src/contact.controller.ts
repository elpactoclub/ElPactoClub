// EN: REST controller for the /contact endpoint that emails contact-form submissions.
// ES: Controlador REST para el endpoint /contact que envía por email los mensajes del formulario de contacto.
import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { MailService } from './mail/mail.service';

// EN: Controller handling contact-form submissions.
// ES: Controlador que gestiona los envíos del formulario de contacto.
@Controller('contact')
export class ContactController {
  constructor(private readonly mail: MailService) {}

  // EN: POST /contact — validates the form fields and sends the message via email (rate-limited).
  // ES: POST /contact — valida los campos del formulario y envía el mensaje por email (con límite de tasa).
  @Post()
  @HttpCode(200)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async send(
    @Body() body: { name: string; email: string; message: string },
  ) {
    if (!body.name?.trim() || !body.email?.trim() || !body.message?.trim()) {
      return { ok: false, error: 'Faltan campos' };
    }
    await this.mail.sendContact({
      fromName: body.name.trim(),
      fromEmail: body.email.trim(),
      message: body.message.trim(),
    });
    return { ok: true };
  }
}
