// EN: DTO that validates the login request body (email + password).
// ES: DTO que valida el cuerpo de la petición de login (email + contraseña).
import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// EN: Payload required to authenticate a user.
// ES: Datos requeridos para autenticar a un usuario.
export class LoginDto {
  @ApiProperty({ example: 'fan@elpacto.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  password: string;
}
