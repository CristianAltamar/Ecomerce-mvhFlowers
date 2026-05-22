import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { prisma } from './config/prisma';
import { disconnectRedis } from './config/redis';
import { startEmailWorker } from './queues/email.worker';

const app = createApp();
const emailWorker = startEmailWorker();

const server = app.listen(env.PORT, () => {
  logger.info(
    `🌸 MVH Flores API escuchando en http://localhost:${env.PORT} (${env.NODE_ENV})`,
  );
});

/**
 * Graceful shutdown: cierra conexiones limpiamente al recibir SIGTERM/SIGINT.
 * Crítico en contenedores Docker para no perder requests en vuelo.
 */
async function shutdown(signal: string) {
  logger.info(`📥 Recibido ${signal}, cerrando servidor...`);

  // Deja de aceptar nuevas conexiones, espera a que terminen las activas
  server.close((err) => {
    if (err) {
      logger.error({ err }, 'Error cerrando HTTP server');
      process.exit(1);
    }
  });

  try {
    if (emailWorker) await emailWorker.close();
    await prisma.$disconnect();
    await disconnectRedis();
    logger.info('👋 Recursos liberados. Bye.');
    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'Error en shutdown');
    process.exit(1);
  }
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, '💥 Unhandled rejection');
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, '💥 Uncaught exception — cerrando proceso');
  process.exit(1);
});
