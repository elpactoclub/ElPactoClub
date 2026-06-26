// EN: Singleton Socket.IO client that reconnects automatically when the JWT token changes (login/logout).
// ES: Cliente Socket.IO singleton que se reconecta automáticamente cuando el token JWT cambia (inicio/cierre de sesión).

import { io, Socket } from 'socket.io-client';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

let socket: Socket | null = null;
let connectedToken: string | null = null;

// EN: Returns the shared socket, creating or reconnecting it if the auth token has changed since last connection.
// ES: Devuelve el socket compartido, creándolo o reconectándolo si el token de autenticación ha cambiado desde la última conexión.
export function getSocket(): Socket {
  if (typeof window === 'undefined') throw new Error('Socket only available client-side');

  const token = localStorage.getItem('el_pacto_token');

  // Reconnect if token changed (login / logout)
  if (socket && connectedToken !== token) {
    socket.disconnect();
    socket = null;
  }

  if (!socket) {
    connectedToken = token;
    socket = io(BACKEND_URL, {
      auth: token ? { token } : {},
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
    });
  }

  return socket;
}

// EN: Explicitly disconnects the socket and clears the singleton so the next getSocket call starts fresh.
// ES: Desconecta explícitamente el socket y limpia el singleton para que la siguiente llamada a getSocket empiece desde cero.
export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
  connectedToken = null;
}
