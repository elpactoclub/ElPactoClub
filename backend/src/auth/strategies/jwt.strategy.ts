// EN: Passport JWT strategy: extracts the bearer token and validates its payload.
// ES: Estrategia JWT de Passport: extrae el token bearer y valida su payload.
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

// EN: Configures JWT extraction/verification and resolves the authenticated user.
// ES: Configura la extracción/verificación del JWT y resuelve el usuario autenticado.
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
  ) {
    const secret = config.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET no está definido en las variables de entorno');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  // EN: Called by Passport after token verification; returns the user for the request.
  // ES: Llamado por Passport tras verificar el token; devuelve el usuario para la petición.
  async validate(payload: { sub: string; email: string; role: string }) {
    return this.authService.validateJwtPayload(payload);
  }
}
