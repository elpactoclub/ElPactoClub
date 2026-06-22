import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePostDto {
  @IsString()
  type: string;

  @IsString()
  @MaxLength(2000, { message: 'El post no puede superar los 2000 caracteres' })
  content: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(120, { each: true, message: 'Cada opción no puede superar los 120 caracteres' })
  pollOptions?: string[];
}

export class AddCommentDto {
  @IsString()
  @MaxLength(1000, { message: 'El comentario no puede superar los 1000 caracteres' })
  content: string;
}

export class CreateMessageDto {
  @IsString()
  @MaxLength(40)
  channel: string;

  @IsString()
  @MaxLength(500, { message: 'El mensaje no puede superar los 500 caracteres' })
  content: string;
}

export class DmCreatorDto {
  @IsString()
  @MaxLength(80)
  creatorName: string;

  @IsString()
  @MaxLength(500, { message: 'El mensaje no puede superar los 500 caracteres' })
  content: string;
}
