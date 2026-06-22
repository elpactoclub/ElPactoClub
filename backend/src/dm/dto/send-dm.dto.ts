import { IsString, MaxLength } from 'class-validator';

export class SendDmDto {
  @IsString()
  recipientId: string;

  @IsString()
  @MaxLength(500, { message: 'El mensaje no puede superar los 500 caracteres' })
  content: string;
}
