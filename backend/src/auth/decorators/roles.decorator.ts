// EN: @Roles() decorator that tags a route with the roles allowed to access it.
// ES: Decorador @Roles() que marca una ruta con los roles permitidos para accederla.
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../users/user.entity';

export const ROLES_KEY = 'roles';
// EN: Attaches the required roles as route metadata (read later by RolesGuard).
// ES: Adjunta los roles requeridos como metadatos de la ruta (leídos luego por RolesGuard).
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
