import { type FastifyInstance, type FastifyPluginAsync, type FastifyRequest, type FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';

const authPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const jwtSecret = process.env['JWT_SECRET'];
    if (!jwtSecret) {
        throw new Error('JWT_SECRET environment variable is not set');
    }

    await fastify.register(fastifyCookie);
    await fastify.register(fastifyJwt, {
        secret: jwtSecret,
        cookie: {
            cookieName: 'token',
            signed: false,
        },
    });

    fastify.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
        try {
            const token = request.cookies['token'] || request.headers.authorization?.replace('Bearer ', '');
            if (!token) {
                return reply.code(401).send({ error: 'unauthorized' });
            }
            await request.jwtVerify();
        } catch {
            return reply.code(401).send({ error: 'unauthorized' });
        }
    });
};

export default fp(authPlugin);

export function generateToken(fastify: FastifyInstance, userId: string, email: string): string {
    return fastify.jwt.sign({ userId, email });
}
