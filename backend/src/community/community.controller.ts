import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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
    @Body() body: { type: string; content: string; pollOptions?: string[] },
  ) {
    return this.svc.createPost(req.user.id, body);
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
