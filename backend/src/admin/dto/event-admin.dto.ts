import { IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

const EVENT_TYPES = ['partido', 'charla', 'tour', 'sorteo', 'reto'] as const;
type EventType = typeof EVENT_TYPES[number];

export type EventPoll = { question: string; options: string[] };

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
