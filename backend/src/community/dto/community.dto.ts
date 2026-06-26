// EN: Validation DTOs for community endpoints (create post, comment, message, creator DM).
// ES: DTOs de validación para los endpoints de comunidad (crear post, comentario, mensaje, DM a creador).
import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

// EN: Payload to create a post; enforces content length and optional poll/image.
// ES: Datos para crear un post; valida longitud del contenido y encuesta/imagen opcionales.
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

// EN: Payload to add a comment; limits content to 1000 chars.
// ES: Datos para añadir un comentario; limita el contenido a 1000 caracteres.
export class AddCommentDto {
  @IsString()
  @MaxLength(1000, { message: 'El comentario no puede superar los 1000 caracteres' })
  content: string;
}

// EN: Payload to post a chat message to a channel.
// ES: Datos para publicar un mensaje de chat en un canal.
export class CreateMessageDto {
  @IsString()
  @MaxLength(40)
  channel: string;

  @IsString()
  @MaxLength(500, { message: 'El mensaje no puede superar los 500 caracteres' })
  content: string;
}

// EN: Payload to send a private direct message to a creator.
// ES: Datos para enviar un mensaje directo privado a un creador.
export class DmCreatorDto {
  @IsString()
  @MaxLength(80)
  creatorName: string;

  @IsString()
  @MaxLength(500, { message: 'El mensaje no puede superar los 500 caracteres' })
  content: string;
}
