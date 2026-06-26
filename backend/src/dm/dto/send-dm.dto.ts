// EN: DTO validating the payload to send a direct message (recipient id + content).
// ES: DTO que valida el payload para enviar un mensaje directo (id del destinatario + contenido).
import { IsString, MaxLength } from 'class-validator';

// EN: Send-DM request body shape with validation rules.
// ES: Forma del cuerpo de la petición para enviar un DM con reglas de validación.
export class SendDmDto {
  @IsString()
  recipientId: string;

  @IsString()
  @MaxLength(500, { message: 'El mensaje no puede superar los 500 caracteres' })
  content: string;
}
