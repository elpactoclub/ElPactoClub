// EN: DTO validating a request to change the user's email and/or password.
// ES: DTO que valida una petición para cambiar el email y/o la contraseña del usuario.
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

// EN: Fields for updating login credentials (requires current password to set a new one).
// ES: Campos para actualizar las credenciales (exige la contraseña actual para fijar una nueva).
export class UpdateCredentialsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail({}, { message: 'Email inválido' })
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currentPassword?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  newPassword?: string;
}
