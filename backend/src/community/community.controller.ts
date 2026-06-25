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

@ApiTags('community')
@Controller('community')
export class CommunityController {
  constructor(
    private readonly svc: CommunityService,
    private readonly tigris: TigrisService,
  ) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Get('posts')
  getPosts(@Req() req: any) {
    return this.svc.getPosts(req.user?.id);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('story-authors')
  getStoryAuthors(@Req() req: any) {
    return this.svc.getStoryAuthors(req.user?.id);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('users/:userId/posts')
  getPostsByUser(@Param('userId') userId: string, @Req() req: any) {
    return this.svc.getPostsByUser(userId, req.user?.id);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('users/:userId/liked')
  getLikedPostsByUser(@Param('userId') userId: string, @Req() req: any) {
    return this.svc.getLikedPostsByUser(userId, req.user?.id);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('posts/:id')
  getPostById(@Param('id') id: string, @Req() req: any) {
    return this.svc.getPostById(id, req.user?.id);
  }

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

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('stories/:id')
  deleteStory(@Req() req: any, @Param('id') id: string) {
    return this.svc.deleteStory(id, req.user.id, req.user.role);
  }

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

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('posts/:id')
  deletePost(@Req() req: any, @Param('id') id: string) {
    return this.svc.deletePost(id, req.user.id, req.user.role);
  }

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

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('posts/:id/like')
  likePost(@Req() req: any, @Param('id') id: string) {
    return this.svc.likePost(id, req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('posts/:id/react')
  reactPost(@Req() req: any, @Param('id') id: string, @Body() body: { emoji: string }) {
    return this.svc.reactPost(id, req.user.id, body.emoji);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('posts/:id/vote')
  votePoll(@Param('id') id: string, @Body() body: { option: string }, @Req() req: any) {
    return this.svc.votePoll(id, body.option, req.user.id);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('posts/:id/comments')
  getComments(@Param('id') id: string, @Req() req: any) {
    return this.svc.getComments(id, req.user?.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('posts/:id/comments')
  addComment(@Param('id') id: string, @Body() body: AddCommentDto, @Req() req: any) {
    return this.svc.addComment(id, req.user.id, body.content);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('comments/:id/like')
  likeComment(@Param('id') id: string, @Req() req: any) {
    return this.svc.likeComment(id, req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('comments/:id')
  deleteComment(@Param('id') id: string, @Req() req: any) {
    return this.svc.deleteComment(id, req.user.id, req.user.role);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('posts/:id/close-poll')
  closePoll(@Param('id') id: string, @Req() req: any) {
    return this.svc.closePoll(id, req.user.id, req.user.role);
  }

  @Get('messages')
  getMessages(@Query('channel') channel: string = 'general') {
    return this.svc.getMessages(channel);
  }

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

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('messages/:id')
  deleteMessage(@Param('id') id: string, @Req() req: any) {
    return this.svc.deleteMessage(id, req.user.id, req.user.role);
  }

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
