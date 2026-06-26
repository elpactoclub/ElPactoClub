// EN: Socket.IO gateway handling realtime connections, room joins and broadcasts for the feed, channels and direct messages.
// ES: Gateway de Socket.IO que gestiona conexiones en tiempo real, unión a salas y difusiones para el feed, los canales y los mensajes directos.
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

// EN: WebSocket gateway managing client lifecycle, channel/DM subscriptions and server-to-client event emissions.
// ES: Gateway WebSocket que gestiona el ciclo de vida del cliente, las suscripciones a canales/DM y las emisiones de eventos del servidor al cliente.
@Injectable()
@WebSocketGateway({ cors: { origin: '*' } })
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly jwt: JwtService) {}

  // EN: On connect, verifies the JWT (if any) and joins the client to its private user room.
  // ES: Al conectar, verifica el JWT (si lo hay) y une al cliente a su sala privada de usuario.
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

  // EN: Handles client disconnection (no cleanup currently required).
  // ES: Gestiona la desconexión del cliente (actualmente no requiere limpieza).
  handleDisconnect(_client: Socket) {}

  // EN: Subscribes the client to the shared 'feed' room for new-post broadcasts.
  // ES: Suscribe al cliente a la sala compartida 'feed' para las difusiones de nuevas publicaciones.
  @SubscribeMessage('join_feed')
  async joinFeed(@ConnectedSocket() client: Socket) {
    await client.join('feed');
  }

  // EN: Joins a channel room, allowing community channels or only the client's own private DM channel.
  // ES: Une al cliente a una sala de canal, permitiendo canales de comunidad o solo su propio canal de DM privado.
  @SubscribeMessage('join_channel')
  async joinChannel(@ConnectedSocket() client: Socket, @MessageBody() channel: string) {
    if (!client.data.userId) return;
    // Only allow joining own DM channel or community channels (not other users' private channels)
    const isPrivateDm = typeof channel === 'string' && channel.startsWith('dm-');
    if (isPrivateDm && channel !== `dm-creator-${client.data.userId}`) return;
    await client.join(`channel:${channel}`);
  }

  // EN: Removes the client from a channel room.
  // ES: Saca al cliente de una sala de canal.
  @SubscribeMessage('leave_channel')
  async leaveChannel(@ConnectedSocket() client: Socket, @MessageBody() channel: string) {
    await client.leave(`channel:${channel}`);
  }

  // EN: Relays a typing indicator from the sender to the recipient's private user room.
  // ES: Reenvía un indicador de "escribiendo" del emisor a la sala privada del destinatario.
  @SubscribeMessage('dm_typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { recipientId: string; isTyping: boolean },
  ) {
    const senderId = client.data.userId;
    if (!senderId || !data.recipientId) return;
    this.server.to(`user:${data.recipientId}`).emit('dm_typing', { senderId, isTyping: data.isTyping });
  }

  // EN: Broadcasts a newly created post to all clients in the 'feed' room.
  // ES: Difunde una publicación recién creada a todos los clientes de la sala 'feed'.
  emitNewPost(post: object) {
    this.server.to('feed').emit('new_post', post);
  }

  // EN: Broadcasts a new chat message to all clients subscribed to the given channel.
  // ES: Difunde un nuevo mensaje de chat a todos los clientes suscritos al canal indicado.
  emitNewMessage(channel: string, message: object) {
    this.server.to(`channel:${channel}`).emit('new_message', { channel, message });
  }

  // EN: Notifies clients in a channel that a message was deleted.
  // ES: Notifica a los clientes de un canal que un mensaje fue eliminado.
  emitDeletedMessage(channel: string, messageId: string) {
    this.server.to(`channel:${channel}`).emit('deleted_message', { channel, messageId });
  }

  // EN: Delivers a new direct message to the recipient's private user room.
  // ES: Entrega un nuevo mensaje directo a la sala privada del destinatario.
  emitNewDM(recipientId: string, dm: object) {
    this.server.to(`user:${recipientId}`).emit('new_dm', dm);
  }
}
