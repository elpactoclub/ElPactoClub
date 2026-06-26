// EN: REST controller exposing the /auth register and login endpoints (rate-limited).
// ES: Controlador REST que expone los endpoints /auth de registro y login (con límite de tasa).
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';

// EN: Controller for authentication routes.
// ES: Controlador para las rutas de autenticación.
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // EN: POST /auth/register — registers a new fan and returns auth tokens.
  // ES: POST /auth/register — registra un nuevo fan y devuelve los tokens de autenticación.
  @Post('register')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: 'Register a new fan' })
  register(@Body() dto: CreateUserDto) {
    return this.authService.register(dto);
  }

  // EN: POST /auth/login — authenticates credentials and returns a JWT.
  // ES: POST /auth/login — autentica las credenciales y devuelve un JWT.
  @Post('login')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login and get JWT' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
