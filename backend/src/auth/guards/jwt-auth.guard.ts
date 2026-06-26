// EN: Guard that requires a valid JWT (rejects unauthenticated requests).
// ES: Guard que exige un JWT válido (rechaza peticiones no autenticadas).
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// EN: Guard enforcing JWT authentication on protected routes.
// ES: Guard que fuerza la autenticación JWT en rutas protegidas.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
