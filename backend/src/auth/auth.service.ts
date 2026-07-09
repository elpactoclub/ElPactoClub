// EN: Authentication service: registration, login, JWT issuing and payload validation.
// ES: Servicio de autenticación: registro, login, emisión de JWT y validación del payload.
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../users/user.entity';

// EN: Handles user authentication and token generation.
// ES: Gestiona la autenticación de usuarios y la generación de tokens.
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  // EN: Creates a new user and returns auth tokens for the session.
  // ES: Crea un nuevo usuario y devuelve los tokens de autenticación para la sesión.
  async register(dto: CreateUserDto) {
    const user = await this.usersService.create(dto);
    return this.generateTokens(user);
  }

  // EN: Verifies credentials, marks the user online and returns auth tokens. rememberMe=true issues a 30-day token.
  // ES: Verifica las credenciales, marca al usuario como online y devuelve los tokens. rememberMe=true emite un token de 30 días.
  async login(dto: LoginDto & { rememberMe?: boolean }) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.password) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    await this.usersService.updateOnlineStatus(user.id, true);
    return this.generateTokens(user, dto.rememberMe ?? false);
  }

  // EN: Resolves the user referenced by a verified JWT payload.
  // ES: Resuelve el usuario referenciado por un payload JWT ya verificado.
  async validateJwtPayload(payload: { sub: string }) {
    return this.usersService.findById(payload.sub);
  }

  // EN: Signs a JWT and returns it alongside a safe public user object. Uses 30d expiry when rememberMe is true.
  // ES: Firma un JWT y lo devuelve junto a un objeto público y seguro del usuario. Usa expiración de 30 días cuando rememberMe es verdadero.
  private generateTokens(user: User, rememberMe = false) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload, rememberMe ? { expiresIn: '30d' } : {}),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        city: user.city,
        country: user.country,
        role: user.role,
        credits: user.credits,
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        isSocio: user.isSocio,
        socioSince: user.socioSince,
        referralCode: user.referralCode,
      },
    };
  }
}
