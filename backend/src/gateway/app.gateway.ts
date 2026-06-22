import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

@Injectable()
@WebSocketGateway({ cors: { origin: '*' } })
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly jwt: JwtService) {}

  async handleConnection(client: Socket) {
    const token =
      (client.handshake.auth?.token as string) ||
      (client.handshake.query?.token as string);
    if (token) {
      try {
        const payload = this.jwt.verify<{ sub: string }>(token);
        client.data.userId = payload.sub;
        await client.join(`user:${payload.sub}`);
      } catch {
        // unauthenticated — public rooms only
      }
    }
  }

  handleDisconnect(_client: Socket) {}

  @SubscribeMessage('join_feed')
  async joinFeed(@ConnectedSocket() client: Socket) {
    await client.join('feed');
  }

  @SubscribeMessage('join_channel')
  async joinChannel(@ConnectedSocket() client: Socket, @MessageBody() channel: string) {
    if (!client.data.userId) return;
    // Only allow joining own DM channel or community channels (not other users' private channels)
    const isPrivateDm = typeof channel === 'string' && channel.startsWith('dm-');
    if (isPrivateDm && channel !== `dm-creator-${client.data.userId}`) return;
    await client.join(`channel:${channel}`);
  }

  @SubscribeMessage('leave_channel')
  async leaveChannel(@ConnectedSocket() client: Socket, @MessageBody() channel: string) {
    await client.leave(`channel:${channel}`);
  }

  @SubscribeMessage('dm_typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { recipientId: string; isTyping: boolean },
  ) {
    const senderId = client.data.userId;
    if (!senderId || !data.recipientId) return;
    this.server.to(`user:${data.recipientId}`).emit('dm_typing', { senderId, isTyping: data.isTyping });
  }

  emitNewPost(post: object) {
    this.server.to('feed').emit('new_post', post);
  }

  emitNewMessage(channel: string, message: object) {
    this.server.to(`channel:${channel}`).emit('new_message', { channel, message });
  }

  emitNewDM(recipientId: string, dm: object) {
    this.server.to(`user:${recipientId}`).emit('new_dm', dm);
  }
}
