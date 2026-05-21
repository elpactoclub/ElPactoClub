import { IsEmail, IsString, MinLength, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

  @ApiPropertyOptional({ example: 'PACTO-HE4701' })
  @IsOptional()
  @IsString()
  referredBy?: string;
}
