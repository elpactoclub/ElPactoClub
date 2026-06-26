// EN: DTO validating the fields an admin may update on a user (profile, role, credits, XP).
// ES: DTO que valida los campos que un admin puede actualizar de un usuario (perfil, rol, créditos, XP).
import { IsBoolean, IsEmail, IsEnum, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

// EN: Payload shape for the admin "update user" endpoint; all fields optional.
// ES: Forma del payload del endpoint admin "actualizar usuario"; todos los campos opcionales.
export class UpdateUserAdminDto {
  @IsOptional() @IsString()
  name?: string;

  @IsOptional() @IsEmail({}, { message: 'Email inválido' })
  email?: string;

  @IsOptional() @IsString() @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password?: string;

  @IsOptional() @IsString()
  city?: string;

  @IsOptional()
  @IsEnum(['fan', 'socio', 'creator', 'admin'])
  role?: 'fan' | 'socio' | 'creator' | 'admin';

  @IsOptional() @IsInt() @Min(0)
  credits?: number;

  @IsOptional() @IsInt() @Min(0)
  xp?: number;

  @IsOptional() @IsBoolean()
  isSocio?: boolean;

  @IsOptional() @IsString()
  bio?: string;
}
