// EN: Exception filter that turns rate-limit (throttler) errors into friendly 429 responses per route.
// ES: Filtro de excepciones que convierte los errores de límite de tasa (throttler) en respuestas 429 amigables por ruta.
import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Response } from 'express';

const MESSAGES: Record<string, string> = {
  '/api/v1/auth/login':            'Demasiados intentos de inicio de sesión. Espera un momento.',
  '/api/v1/auth/register':         'Demasiados registros desde esta IP. Espera un momento.',
  '/api/v1/community/messages':    'Estás enviando mensajes muy rápido. ¡Ve más despacio! 🐢',
  '/api/v1/community/dm-creator':  'Estás enviando mensajes muy rápido. ¡Ve más despacio! 🐢',
  '/api/v1/dm/send':               'Estás enviando mensajes muy rápido. ¡Ve más despacio! 🐢',
  '/api/v1/community/posts':       'Estás publicando muy rápido. Espera un momento.',
  '/api/v1/contact':               'Demasiados mensajes de contacto. Espera unos minutos.',
};

// EN: Catches ThrottlerException and returns a localized 429 message.
// ES: Captura ThrottlerException y devuelve un mensaje 429 localizado.
@Catch(ThrottlerException)
export class ThrottlerExceptionFilter implements ExceptionFilter {
  // EN: Builds the 429 response, choosing a per-route message based on the request path.
  // ES: Construye la respuesta 429, eligiendo un mensaje por ruta según la ruta de la petición.
  catch(_exception: ThrottlerException, host: ArgumentsHost) {
    const ctx  = host.switchToHttp();
    const res  = ctx.getResponse<Response>();
    const req  = ctx.getRequest<{ path: string }>();

    const path    = req.path ?? '';
    const message = MESSAGES[path] ?? 'Demasiadas peticiones. Espera un momento antes de continuar.';

    res.status(HttpStatus.TOO_MANY_REQUESTS).json({
      statusCode: 429,
      error:      'Too Many Requests',
      message,
    });
  }
}
