import { IsBoolean, IsEmail, IsEnum, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

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
