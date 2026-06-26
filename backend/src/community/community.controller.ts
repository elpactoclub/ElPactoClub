// EN: REST controller for the community feature: posts, stories, comments, reactions, polls, channel messages and DMs to creators.
// ES: Controlador REST de la comunidad: publicaciones, historias, comentarios, reacciones, encuestas, mensajes de canal y DMs a creadores.
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CommunityService } from './community.service';
import { TigrisService } from '../tigris/tigris.service';
import { CreatePostDto, AddCommentDto, CreateMessageDto, DmCreatorDto } from './dto/community.dto';

// EN: Groups all community HTTP endpoints under the /community route prefix.
// ES: Agrupa todos los endpoints HTTP de la comunidad bajo el prefijo de ruta /community.
@ApiTags('community')
@Controller('community')
export class CommunityController {
  constructor(
    private readonly svc: CommunityService,
    private readonly tigris: TigrisService,
  ) {}

  // EN: Returns the public post feed, including the current user's like state when authenticated.
  // ES: Devuelve el feed público de publicaciones, incluyendo el estado de "me gusta" del usuario si está autenticado.
  @UseGuards(OptionalJwtAuthGuard)
  @Get('posts')
  getPosts(@Req() req: any) {
    return this.svc.getPosts(req.user?.id);
  }

  // EN: Returns the list of authors who currently have active stories.
  // ES: Devuelve la lista de autores que actualmente tienen historias activas.
  @UseGuards(OptionalJwtAuthGuard)
  @Get('story-authors')
  getStoryAuthors(@Req() req: any) {
    return this.svc.getStoryAuthors(req.user?.id);
  }

  // EN: Returns all posts authored by a specific user.
  // ES: Devuelve todas las publicaciones creadas por un usuario concreto.
  @UseGuards(OptionalJwtAuthGuard)
  @Get('users/:userId/posts')
  getPostsByUser(@Param('userId') userId: string, @Req() req: any) {
    return this.svc.getPostsByUser(userId, req.user?.id);
  }

  // EN: Returns the posts a specific user has liked.
  // ES: Devuelve las publicaciones a las que un usuario concreto ha dado "me gusta".
  @UseGuards(OptionalJwtAuthGuard)
  @Get('users/:userId/liked')
  getLikedPostsByUser(@Param('userId') userId: string, @Req() req: any) {
    return this.svc.getLikedPostsByUser(userId, req.user?.id);
  }

  // EN: Returns a single post by its id.
  // ES: Devuelve una única publicación por su id.
  @UseGuards(OptionalJwtAuthGuard)
  @Get('posts/:id')
  getPostById(@Param('id') id: string, @Req() req: any) {
    return this.svc.getPostById(id, req.user?.id);
  }

  // EN: Uploads an image/video file to storage and creates a new story for the authenticated user.
  // ES: Sube un archivo de imagen/vídeo al almacenamiento y crea una nueva historia para el usuario autenticado.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('stories')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 30 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype.startsWith('image/') && !file.mimetype.startsWith('video/')) {
        return cb(new Error('Solo se permiten imágenes o vídeos') as any, false);
      }
      cb(null, true);
    },
  }))
  async createStory(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body('caption') caption?: string,
  ) {
    const imageUrl = await this.tigris.upload(file, 'stories');
    return this.svc.createStory(req.user.id, imageUrl, caption);
  }

  // EN: Deletes a story; allowed for its owner or for admins.
  // ES: Elimina una historia; permitido para su autor o para administradores.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('stories/:id')
  deleteStory(@Req() req: any, @Param('id') id: string) {
    return this.svc.deleteStory(id, req.user.id, req.user.role);
  }

  // EN: Creates a new post (rate-limited to 5 per minute per user).
  // ES: Crea una nueva publicación (limitada a 5 por minuto por usuario).
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('posts')
  createPost(
    @Req() req: any,
    @Body() body: CreatePostDto,
  ) {
    return this.svc.createPost(req.user.id, body);
  }

  // EN: Deletes a post; allowed for its author or for admins.
  // ES: Elimina una publicación; permitido para su autor o para administradores.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('posts/:id')
  deletePost(@Req() req: any, @Param('id') id: string) {
    return this.svc.deletePost(id, req.user.id, req.user.role);
  }

  // EN: Uploads a post image to storage and returns its public URL.
  // ES: Sube una imagen de publicación al almacenamiento y devuelve su URL pública.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('upload-image')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 8 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Solo se permiten imágenes') as any, false);
      }
      cb(null, true);
    },
  }))
  async uploadPostImage(@UploadedFile() file: Express.Multer.File) {
    const url = await this.tigris.upload(file, 'posts');
    return { url };
  }

  // EN: Toggles the authenticated user's like on a post.
  // ES: Alterna el "me gusta" del usuario autenticado en una publicación.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('posts/:id/like')
  likePost(@Req() req: any, @Param('id') id: string) {
    return this.svc.likePost(id, req.user.id);
  }

  // EN: Adds or updates an emoji reaction from the authenticated user on a post.
  // ES: Añade o actualiza una reacción de emoji del usuario autenticado en una publicación.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('posts/:id/react')
  reactPost(@Req() req: any, @Param('id') id: string, @Body() body: { emoji: string }) {
    return this.svc.reactPost(id, req.user.id, body.emoji);
  }

  // EN: Casts the authenticated user's vote on a post's poll option.
  // ES: Registra el voto del usuario autenticado en una opción de la encuesta de una publicación.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('posts/:id/vote')
  votePoll(@Param('id') id: string, @Body() body: { option: string }, @Req() req: any) {
    return this.svc.votePoll(id, body.option, req.user.id);
  }

  // EN: Returns the comments for a post, including the user's like state when authenticated.
  // ES: Devuelve los comentarios de una publicación, incluyendo el estado de "me gusta" del usuario si está autenticado.
  @UseGuards(OptionalJwtAuthGuard)
  @Get('posts/:id/comments')
  getComments(@Param('id') id: string, @Req() req: any) {
    return this.svc.getComments(id, req.user?.id);
  }

  // EN: Adds a comment to a post (rate-limited to 10 per minute per user).
  // ES: Añade un comentario a una publicación (limitado a 10 por minuto por usuario).
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('posts/:id/comments')
  addComment(@Param('id') id: string, @Body() body: AddCommentDto, @Req() req: any) {
    return this.svc.addComment(id, req.user.id, body.content);
  }

  // EN: Toggles the authenticated user's like on a comment.
  // ES: Alterna el "me gusta" del usuario autenticado en un comentario.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('comments/:id/like')
  likeComment(@Param('id') id: string, @Req() req: any) {
    return this.svc.likeComment(id, req.user.id);
  }

  // EN: Deletes a comment; allowed for its author or for admins.
  // ES: Elimina un comentario; permitido para su autor o para administradores.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('comments/:id')
  deleteComment(@Param('id') id: string, @Req() req: any) {
    return this.svc.deleteComment(id, req.user.id, req.user.role);
  }

  // EN: Closes a post's poll so no further votes are accepted; allowed for its author or admins.
  // ES: Cierra la encuesta de una publicación para no aceptar más votos; permitido para su autor o administradores.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('posts/:id/close-poll')
  closePoll(@Param('id') id: string, @Req() req: any) {
    return this.svc.closePoll(id, req.user.id, req.user.role);
  }

  // EN: Returns the chat messages for a given channel (defaults to 'general').
  // ES: Devuelve los mensajes de chat de un canal dado (por defecto 'general').
  @Get('messages')
  getMessages(@Query('channel') channel: string = 'general') {
    return this.svc.getMessages(channel);
  }

  // EN: Posts a chat message to a channel (rate-limited to 10 per minute per user).
  // ES: Publica un mensaje de chat en un canal (limitado a 10 por minuto por usuario).
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('messages')
  createMessage(
    @Req() req: any,
    @Body() body: CreateMessageDto,
  ) {
    return this.svc.createMessage(req.user.id, body.channel, body.content);
  }

  // EN: Deletes a chat message; allowed for its author or for admins.
  // ES: Elimina un mensaje de chat; permitido para su autor o para administradores.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('messages/:id')
  deleteMessage(@Param('id') id: string, @Req() req: any) {
    return this.svc.deleteMessage(id, req.user.id, req.user.role);
  }

  // EN: Sends a direct message to a creator (rate-limited to 1 every 10 seconds per user).
  // ES: Envía un mensaje directo a un creador (limitado a 1 cada 10 segundos por usuario).
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 10000, limit: 1 } })
  @Post('dm-creator')
  dmCreator(
    @Req() req: any,
    @Body() body: DmCreatorDto,
  ) {
    return this.svc.dmToCreator(req.user.id, body.creatorName, body.content);
  }
}
