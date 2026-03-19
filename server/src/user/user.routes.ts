import { type FastifyInstance } from 'fastify';
import { loginHandler, registerHandler } from './user.controller.ts';
import { registerRequestSchema, loginRequestSchema, authResponseSchema, errorSchema } from './user.schema.ts';

export async function userRoutes(server: FastifyInstance) {
    server.addSchema(registerRequestSchema);
    server.addSchema(loginRequestSchema);
    server.addSchema(authResponseSchema);
    server.addSchema(errorSchema);

    server.post(
        '/api/auth/register',
        {
            schema: {
                body: registerRequestSchema,
                response: {
                    201: authResponseSchema,
                    400: errorSchema,
                },
            },
        },
        registerHandler,
    );

    server.post(
        '/api/auth/login',
        {
            schema: {
                body: loginRequestSchema,
                response: {
                    200: authResponseSchema,
                    401: errorSchema,
                },
            },
        },
        loginHandler,
    );
}
