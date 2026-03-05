import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import Fastify from 'fastify';
import path from 'path';
import dbConnector from './dbconnector';
import { documentRoutes } from './document/document.routes';
import { filestoreRoutes } from './filestore/filestore.routes';

const fastify = Fastify({ logger: true });

fastify.register(dbConnector);

fastify.register(fastifyMultipart);

fastify.register(filestoreRoutes);
fastify.register(documentRoutes);

fastify.register(fastifyStatic, {
    root: path.resolve(__dirname, '../../client/dist'),
    prefix: '/',
    wildcard: false,
    index: ['index.html'],
});

fastify.get('*', async (_request, reply) => {
    reply.sendFile('index.html');
});

fastify.listen({ port: 3000, host: '0.0.0.0' }, function (err, address) {
    if (err) {
        fastify.log.error(err);
        process.exit(1);
    }

    fastify.log.info(`server listening on ${address}`);
});
