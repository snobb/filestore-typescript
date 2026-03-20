import { z } from 'zod';

export const filestoreFileInfoSchema = z.object({
    path: z.string(),
    checksum: z.string().regex(/^[a-fA-F0-9]+$/),
    file_size: z.number(),
});

export const errorSchema = z.object({
    error: z.string(),
});
