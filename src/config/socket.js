let io = null;

const initSocket = (httpServer) => {
  const { Server } = require('socket.io');
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    },
  });

  io.on('connection', (socket) => {
    console.log('[Socket.io] Nouveau client connecté :', socket.id);

    socket.on('disconnect', () => {
      console.log('[Socket.io] Client déconnecté :', socket.id);
    });
  });

  return io;
};

const getIO = () => {
  return io;
};

const emitEvent = (eventName, data) => {
  if (io) {
    io.emit(eventName, data);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitEvent,
};
