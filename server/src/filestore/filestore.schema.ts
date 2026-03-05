import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export const fileInfoSchema = z.object({
    path: z.string(),
    check_sum: z.string().regex(/^[a-fA-F0-9]+$/),
    file_size: z.number(),
});

export const filestoreErrorSchema = z.object({
    error: z.string(),
});

export const filestoreSchemas = [
    {
        $id: 'filestoreSchemas.fileInfoSchema',
        ...zodToJsonSchema(fileInfoSchema as any),
    },
    {
        $id: 'filestoreSchemas.errorSchema',
        ...zodToJsonSchema(filestoreErrorSchema as any),
    },
];

export const $ref = (name: string) => ({ $ref: `filestoreSchemas.${name}Schema` });
