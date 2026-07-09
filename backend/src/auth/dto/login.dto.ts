// EN: DTO that validates the login request body (email + password + optional rememberMe).
// ES: DTO que valida el cuerpo de la petición de login (email + contraseña + rememberMe opcional).
import { IsBoolean, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

  @ApiPropertyOptional({ example: false, description: 'Issue a 30-day token instead of the default expiry / Emite un token de 30 días en lugar de la expiración por defecto' })
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
