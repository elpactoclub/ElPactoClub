import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateUserAdminDto {
  @IsOptional() @IsString()
  name?: string;

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
