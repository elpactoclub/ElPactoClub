// EN: Guard that authorizes requests against the @Roles() metadata of the route.
// ES: Guard que autoriza peticiones según los metadatos @Roles() de la ruta.
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../users/user.entity';

// EN: Role-based authorization guard for protected routes.
// ES: Guard de autorización por roles para rutas protegidas.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  // EN: Allows the request only if the user's role matches the route's required roles.
  // ES: Permite la petición solo si el rol del usuario coincide con los roles requeridos por la ruta.
  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('No user in request');
    if (!required.includes(user.role)) {
      throw new ForbiddenException(`Required role: ${required.join(' or ')}, got ${user.role}`);
    }
    return true;
  }
}
