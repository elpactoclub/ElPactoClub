// EN: Mail module: provides and exports the MailService for sending emails.
// ES: Módulo de correo: provee y exporta el MailService para enviar emails.
import { Module } from '@nestjs/common';
import { MailService } from './mail.service';

// EN: Mail feature module declaration.
// ES: Declaración del módulo de la funcionalidad de correo.
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
