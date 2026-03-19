import { z } from 'zod';

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
