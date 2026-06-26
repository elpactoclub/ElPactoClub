// EN: Validation DTOs for submitting an event for approval, including its optional polls.
// ES: DTOs de validación para enviar un evento a aprobación, incluyendo sus encuestas opcionales.
import { IsString, IsOptional, IsEnum, IsNumber, IsArray, IsDateString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// EN: A single poll attached to an event: a question with its answer options.
// ES: Una encuesta asociada a un evento: una pregunta con sus opciones de respuesta.
class PollDto {
  @IsString() question: string;
  @IsArray() @IsString({ each: true }) options: string[];
}

// EN: Payload a creator submits to propose a new event for admin approval.
// ES: Datos que un creador envía para proponer un nuevo evento a aprobación del admin.
export class SubmitEventDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ['partido', 'charla', 'tour', 'sorteo', 'reto'] })
  @IsEnum(['partido', 'charla', 'tour', 'sorteo', 'reto'])
  type: 'partido' | 'charla' | 'tour' | 'sorteo' | 'reto';

  @ApiProperty()
  @IsDateString()
  date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAttendees?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  liveStreamUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  speakers?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PollDto)
  polls?: PollDto[];
}
