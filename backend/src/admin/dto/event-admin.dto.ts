import { IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

const EVENT_TYPES = ['partido', 'charla', 'tour', 'sorteo', 'reto'] as const;
type EventType = typeof EVENT_TYPES[number];

export class CreateEventAdminDto {
  @IsString()
  title: string;

  @IsOptional() @IsString()
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
  liveStreamUrl?: string;
}

export class UpdateEventAdminDto {
  @IsOptional() @IsString()
  title?: string;

  @IsOptional() @IsString()
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
  liveStreamUrl?: string;
}
