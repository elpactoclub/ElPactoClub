// EN: DTO validating the body for creating/registering a user.
// ES: DTO que valida el cuerpo para crear/registrar un usuario.
import { IsEmail, IsString, MinLength, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// EN: Fields accepted when registering a new user.
// ES: Campos aceptados al registrar un nuevo usuario.
export class CreateUserDto {
  @ApiProperty({ example: 'fan@elpacto.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ example: 'MikelFan23' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({ example: 'Barcelona' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'España' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: 'PACTO-HE4701' })
  @IsOptional()
  @IsString()
  referredBy?: string;
}
