const app = require('./app');
const env = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');
const { initSocket } = require('./config/socket');
const logger = require('./utils/logger');

let server;

const startServer = async () => {
  try {
    await connectDB();

    server = app.listen(env.PORT, () => {
      logger.info(`[Baticlean Backend] Serveur démarré en mode ${env.NODE_ENV} sur le port ${env.PORT}`);
    });

    initSocket(server);
    logger.info('[Baticlean Backend] Service WebSocket (Socket.io) prêt.');
  } catch (error) {
    logger.error(`[Baticlean Backend] Échec de démarrage : ${error.message}`);
    process.exit(1);
  }
};

const handleShutdown = async (signal) => {
  logger.info(`[Baticlean Backend] Signal ${signal} reçu. Arrêt gracieux du serveur...`);
  if (server) {
    server.close(async () => {
      logger.info('[Baticlean Backend] Serveur HTTP fermé.');
      await disconnectDB();
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

process.on('unhandledRejection', (err) => {
  logger.error(`[Rejet non géré] ${err.stack || err.message}`);
});

process.on('uncaughtException', (err) => {
  logger.error(`[Exception non capturée] ${err.stack || err.message}`);
  process.exit(1);
});

startServer();
