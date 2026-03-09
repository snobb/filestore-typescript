import { FastifyInstance, FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';

declare module '@fastify/jwt' {
    interface FastifyJWT {
        payload: { userId: string; email: string };
        user: { userId: string; email: string };
    }
}

declare module 'fastify' {
    interface FastifyInstance {
        authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    }
}

const authPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const jwtSecret = process.env.JWT_SECRET;
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
            const token = request.cookies.token || request.headers.authorization?.replace('Bearer ', '');
            if (!token) {
                return reply.code(401).send({ error: 'unauthorized' });
            }
            await request.jwtVerify();
        } catch (err) {
            return reply.code(401).send({ error: 'unauthorized' });
        }
    });
};

export default fp(authPlugin);

export function generateToken(fastify: FastifyInstance, userId: string, email: string): string {
    return fastify.jwt.sign({ userId, email });
}
