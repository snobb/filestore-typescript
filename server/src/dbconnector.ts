import fastifyPostgres from '@fastify/postgres';
import { FastifyPluginAsync } from 'fastify';
import fastifyPlugin from 'fastify-plugin';

/**
 * @param {FastifyInstance} fastify
 * @param {Object} options
 */
const dbConnector: FastifyPluginAsync = async (fastify) => {
    const user = process.env.POSTGRES_USER || 'postgres';
    const password = process.env.POSTGRES_PASSWORD || 'postgres';
    const host = process.env.POSTGRES_HOST || 'localhost';
    const port = parseInt(process.env.POSTGRES_PORT || '5432');
    const database = process.env.POSTGRES_DATABASE || 'filestore';

    // .register will now be recognized perfectly!
    fastify.register(fastifyPostgres, {
        connectionString: `postgresql://${user}:${password}@${host}:${port}/${database}?sslmode=disable`,
    });
};

export default fastifyPlugin(dbConnector);
