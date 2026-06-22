import { io, Socket } from 'socket.io-client';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

let socket: Socket | null = null;
let connectedToken: string | null = null;

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

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
  connectedToken = null;
}
