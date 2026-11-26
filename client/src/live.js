import { io } from 'socket.io-client';

const SERVER = 'http://localhost:5000';
let socket = null;
const handlers = new Set();

export function connectLive(token) {
  disconnectLive();
  socket = io(SERVER, { auth: { token } });
  socket.on('notification', (n) => handlers.forEach((fn) => fn(n)));
}

export function disconnectLive() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// subscribe to incoming notifications; returns an unsubscribe function
export function onNotification(fn) {
  handlers.add(fn);
  return () => handlers.delete(fn);
}