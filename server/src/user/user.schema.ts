import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export const registerRequestSchema = z.object({
    email: z.email(),
    password: z.string().min(8),
});

export const loginRequestSchema = z.object({
    email: z.email(),
    password: z.string(),
});

export const authResponseSchema = z.object({
    user_id: z.uuid(),
    email: z.email(),
});

export const errorSchema = z.object({
    error: z.string(),
});

export const userSchemas = [
    {
        $id: 'user.registerRequest',
        ...zodToJsonSchema(registerRequestSchema as any),
    },
    {
        $id: 'user.loginRequest',
        ...zodToJsonSchema(loginRequestSchema as any),
    },
    {
        $id: 'user.authResponse',
        ...zodToJsonSchema(authResponseSchema as any),
    },
    {
        $id: 'user.error',
        ...zodToJsonSchema(errorSchema as any),
    },
];

export const $ref = (name: string) => ({ $ref: `user.${name}` });
