// EN: NestJS module providing the WebSocket gateway, configured with JWT verification for socket auth.
// ES: Módulo NestJS que provee el gateway de WebSocket, configurado con verificación JWT para la autenticación de sockets.
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AppGateway } from './app.gateway';

// EN: Registers the JWT module and exposes/exports the AppGateway provider.
// ES: Registra el módulo JWT y expone/exporta el proveedor AppGateway.
@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AppGateway],
  exports: [AppGateway],
})
export class GatewayModule {}
