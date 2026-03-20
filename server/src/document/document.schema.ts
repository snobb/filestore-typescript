import { z } from 'zod';

export const uploadPendingRequestSchema = z.object({
    file_name: z.string(),
    content_type: z.string(),
});

export const uploadPendingResponseSchema = z.object({
    id: z.uuid(),
    upload_url: z.string(),
    status_url: z.string(),
});

export const updateStatusRequestSchema = z.object({
    status: z.enum(['pending', 'uploaded', 'verified']),
    checksum: z.string().regex(/^[a-fA-F0-9]+$/), // hex
    file_size: z.number(),
});

export const updateStatusResponseSchema = z.object({
    id: z.uuid(),
    user_id: z.uuid(),
    file_name: z.string(),
    file_path: z.string(),
    file_size: z.number(),
    content_type: z.string(),
    checksum: z.string(),
    status: z.enum(['pending', 'uploaded', 'verified']),
    uploaded_at: z.string().nullish(),
    updated_at: z.string(),
    created_at: z.string(),
});

export const errorSchema = z.object({
    error: z.string(),
});

export const getDocumentParamsSchema = z.object({
    id: z.uuid(),
});

export const getDocumentResponseSchema = z.object({
    id: z.uuid(),
    user_id: z.uuid(),
    file_name: z.string(),
    file_path: z.string(),
    file_size: z.number(),
    content_type: z.string(),
    checksum: z.string().nullish(),
    status: z.enum(['pending', 'uploaded', 'verified']),
    uploaded_at: z.string().nullish(),
    updated_at: z.string().nullish(),
    created_at: z.string(),
});

export const listDocumentsResponseSchema = z.array(getDocumentResponseSchema);
