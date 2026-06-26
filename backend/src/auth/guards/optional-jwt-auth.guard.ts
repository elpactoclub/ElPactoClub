// EN: Guard that authenticates via JWT if present but allows anonymous requests too.
// ES: Guard que autentica vía JWT si está presente pero también permite peticiones anónimas.
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// EN: Optional JWT guard — attaches the user when authenticated, never blocks otherwise.
// ES: Guard JWT opcional — adjunta el usuario si está autenticado, nunca bloquea en caso contrario.
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // EN: Runs the standard JWT authentication attempt.
  // ES: Ejecuta el intento estándar de autenticación JWT.
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  // EN: Returns the user if found, or null instead of throwing on missing/invalid token.
  // ES: Devuelve el usuario si existe, o null en lugar de lanzar error si falta o es inválido el token.
  handleRequest(_err: any, user: any) {
    return user || null;
  }
}
