import { Body, Controller, Delete, Get, Param, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CommunityService } from './community.service';

@ApiTags('community')
@Controller('community')
export class CommunityController {
  constructor(private readonly svc: CommunityService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Get('posts')
  getPosts(@Req() req: any) {
    return this.svc.getPosts(req.user?.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('posts')
  createPost(
    @Req() req: any,
    @Body() body: { type: string; content: string; pollOptions?: string[]; imageUrl?: string },
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
    storage: diskStorage({
      destination: (req, file, cb) => {
        const dir = join(process.cwd(), 'uploads', 'posts');
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
        cb(null, unique);
      },
    }),
    limits: { fileSize: 8 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Solo se permiten imágenes') as any, false);
      }
      cb(null, true);
    },
  }))
  uploadPostImage(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    const backendUrl = process.env.BACKEND_URL ?? `${req.protocol}://${req.get('host')}`;
    return { url: `${backendUrl}/uploads/posts/${file.filename}` };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('posts/:id/like')
  likePost(@Req() req: any, @Param('id') id: string) {
    return this.svc.likePost(id, req.user.id);
  }

  @Post('posts/:id/vote')
  votePoll(@Param('id') id: string, @Body() body: { option: string }) {
    return this.svc.votePoll(id, body.option);
  }

  @Get('messages')
  getMessages(@Query('channel') channel: string = 'general') {
    return this.svc.getMessages(channel);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('messages')
  createMessage(
    @Req() req: any,
    @Body() body: { channel: string; content: string },
  ) {
    return this.svc.createMessage(req.user.id, body.channel, body.content);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('dm-creator')
  dmCreator(
    @Req() req: any,
    @Body() body: { creatorName: string; content: string },
  ) {
    return this.svc.dmToCreator(req.user.id, body.creatorName, body.content);
  }
}
