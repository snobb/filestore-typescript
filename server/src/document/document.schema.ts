import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export const uploadPendingRequestSchema = z.object({
    file_name: z.string(),
    content_type: z.string(),
});

export const uploadPendingResponseSchema = z.object({
    id: z.uuid(),
    upload_url: z.url(),
    status_url: z.url(),
});

export const updateStatusRequestSchema = z.object({
    path: z.string(),
    check_sum: z.regex(/^[a-fA-F0-9]+$/),
    file_size: z.number(),
});

export const updateStatusResponseSchema = z.object({
    id: z.uuid(),
    user_id: z.uuid(),
    file_name: z.string(),
    file_path: z.string(),
    file_size: z.number(),
    content_type: z.string(),
    checksum: z.regex(/^[a-fA-F0-9]+$/),
    status: z.enum(['pending', 'uploaded', 'verified']),
    uploaded_at: z.string(),
    updated_at: z.string(),
    created_at: z.string(),
});

export const errorSchema = z.object({
    error: z.string(),
});

export const getDocumentParamsSchema = z.object({
    id: z.string().uuid(),
});

export const getDocumentResponseSchema = z.object({
    id: z.uuid(),
    user_id: z.uuid(),
    file_name: z.string(),
    file_path: z.string(),
    file_size: z.number(),
    content_type: z.string(),
    checksum: z.string().optional(),
    status: z.enum(['pending', 'uploaded', 'verified']),
    uploaded_at: z.string().optional(),
    updated_at: z.string().optional(),
    created_at: z.string(),
});

export const listDocumentsResponseSchema = z.array(getDocumentResponseSchema);

export const documentSchemas = [
    {
        $id: 'documentSchemas.uploadPendingRequestSchema',
        ...zodToJsonSchema(uploadPendingRequestSchema as any),
    },
    {
        $id: 'documentSchemas.uploadPendingResponseSchema',
        ...zodToJsonSchema(uploadPendingResponseSchema as any),
    },
    {
        $id: 'documentSchemas.updateStatusRequestSchema',
        ...zodToJsonSchema(updateStatusRequestSchema as any),
    },
    {
        $id: 'documentSchemas.updateStatusResponseSchema',
        ...zodToJsonSchema(updateStatusResponseSchema as any),
    },
    {
        $id: 'documentSchemas.errorSchema',
        ...zodToJsonSchema(errorSchema as any),
    },
    {
        $id: 'documentSchemas.getDocumentParamsSchema',
        ...zodToJsonSchema(getDocumentParamsSchema as any),
    },
    {
        $id: 'documentSchemas.getDocumentResponseSchema',
        ...zodToJsonSchema(getDocumentResponseSchema as any),
    },
    {
        $id: 'documentSchemas.listDocumentsResponseSchema',
        ...zodToJsonSchema(listDocumentsResponseSchema as any),
    },
];

export const $ref = (name: string) => ({ $ref: `documentSchemas.${name}Schema` });
