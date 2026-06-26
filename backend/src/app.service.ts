// EN: Root application service — provides the basic hello/health response.
// ES: Servicio raíz de la aplicación — proporciona la respuesta básica de hello/salud.
import { Injectable } from '@nestjs/common';

// EN: Injectable service backing the root controller.
// ES: Servicio inyectable que da soporte al controlador raíz.
@Injectable()
export class AppService {
  // EN: Returns a static greeting string.
  // ES: Devuelve una cadena de saludo estática.
  getHello(): string {
    return 'Hello World!';
  }
}
