// EN: DTOs validating event creation and update payloads used by the admin endpoints.
// ES: DTOs que validan los payloads de creación y actualización de eventos usados por los endpoints admin.
import { IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

const EVENT_TYPES = ['partido', 'charla', 'tour', 'sorteo', 'reto'] as const;
type EventType = typeof EVENT_TYPES[number];

export type EventPoll = { question: string; options: string[] };

// EN: Payload shape for creating an event from the admin panel (title required, rest optional).
// ES: Forma del payload para crear un evento desde el panel admin (título obligatorio, resto opcional).
export class CreateEventAdminDto {
  @IsString()
  @MaxLength(120)
  title: string;

  @IsOptional() @IsString()
  @MaxLength(2000)
  description?: string;

  @IsEnum(EVENT_TYPES)
  type: EventType;

  @IsDateString()
  date: string;

  @IsOptional() @IsString()
  location?: string;

  @IsOptional() @IsString()
  city?: string;

  @IsOptional() @IsInt() @Min(0)
  creditsCost?: number;

  @IsOptional() @IsInt() @Min(0)
  maxAttendees?: number;

  @IsOptional() @IsBoolean()
  isActive?: boolean;

  @IsOptional() @IsString()
  imageUrl?: string;

  @IsOptional() @IsString()
  bannerUrl?: string;

  @IsOptional() @IsString()
  liveStreamUrl?: string;

  @IsOptional() @IsBoolean()
  showOnHome?: boolean;

  @IsOptional() @IsArray()
  polls?: EventPoll[];
}

// EN: Payload shape for updating an event from the admin panel; all fields optional.
// ES: Forma del payload para actualizar un evento desde el panel admin; todos los campos opcionales.
export class UpdateEventAdminDto {
  @IsOptional() @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional() @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional() @IsEnum(EVENT_TYPES)
  type?: EventType;

  @IsOptional() @IsDateString()
  date?: string;

  @IsOptional() @IsString()
  location?: string;

  @IsOptional() @IsString()
  city?: string;

  @IsOptional() @IsInt() @Min(0)
  creditsCost?: number;

  @IsOptional() @IsInt() @Min(0)
  maxAttendees?: number;

  @IsOptional() @IsBoolean()
  isActive?: boolean;

  @IsOptional() @IsString()
  imageUrl?: string;

  @IsOptional() @IsString()
  bannerUrl?: string;

  @IsOptional() @IsString()
  liveStreamUrl?: string;

  @IsOptional() @IsBoolean()
  showOnHome?: boolean;

  @IsOptional() @IsArray()
  polls?: EventPoll[];
}
