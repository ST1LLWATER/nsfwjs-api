import fastify from 'fastify';
import multipart from '@fastify/multipart';
import cors from '@fastify/cors';

import { routes } from './routes.js';

const fastifyServer = fastify({
  bodyLimit: 1048576 * 100,
});

fastifyServer.register(multipart, {
  addToBody: true,
  sharedSchemaId: '#mySharedSchema',
});

await fastifyServer.register(cors, {
  origin: '*',
});

fastifyServer.register(routes);

await fastifyServer.listen({ port: 3333, host: '0.0.0.0' });

console.log('Server started 🚀');

function handleOnSignal(signal: NodeJS.Signals) {
  console.log(`closing due to ${signal} signal`);

  fastifyServer.close().then(() => {
    process.exit();
  });
}

process.on('SIGINT', () => {
  handleOnSignal('SIGINT');
});

process.on('SIGHUP', () => {
  handleOnSignal('SIGHUP');
});
