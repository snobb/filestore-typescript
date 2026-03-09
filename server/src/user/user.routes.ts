import { FastifyInstance } from 'fastify';
import { loginHandler, registerHandler } from './user.controller';
import { $ref, userSchemas } from './user.schema';

export async function userRoutes(server: FastifyInstance) {
    for (const schema of userSchemas) {
        server.addSchema(schema);
    }

    server.post(
        '/api/auth/register',
        {
            schema: {
                body: $ref('registerRequest'),
                response: {
                    201: $ref('authResponse'),
                    400: $ref('error'),
                },
            },
        },
        registerHandler,
    );

    server.post(
        '/api/auth/login',
        {
            schema: {
                body: $ref('loginRequest'),
                response: {
                    200: $ref('authResponse'),
                    401: $ref('error'),
                },
            },
        },
        loginHandler,
    );
}
