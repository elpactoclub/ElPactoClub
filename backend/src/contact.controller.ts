import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { MailService } from './mail/mail.service';

@Controller('contact')
export class ContactController {
  constructor(private readonly mail: MailService) {}

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
