const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');

let io = null;

function init(httpServer) {
  io = new Server(httpServer, { cors: { origin: '*' } });

  // only logged-in users can connect
  io.use((socket, next) => {
    try {
      socket.user = jwt.verify(socket.handshake.auth.token, process.env.JWT_SECRET);
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  // every user gets a private room, so messages reach only them
  io.on('connection', (socket) => {
    socket.join(`user:${socket.user.id}`);
  });
}

function toUser(userId, event, payload) {
  if (io) io.to(`user:${userId}`).emit(event, payload);
}

module.exports = { init, toUser };