import { type FastifyInstance, type FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { DiskFileStore } from '../filestore/disk.ts';
import {
    getDocumentHandler,
    listDocumentsHandler,
    updateDocumentStatusHandler,
    uploadPendingHandler,
} from './document.controller.ts';
import {
    errorSchema,
    getDocumentParamsSchema,
    getDocumentResponseSchema,
    listDocumentsResponseSchema,
    updateStatusRequestSchema,
    updateStatusResponseSchema,
    uploadPendingRequestSchema,
    uploadPendingResponseSchema,
} from './document.schema.ts';
import { Service as DocumentService } from './document.service.ts';

const documentPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const fileStore = new DiskFileStore(process.env['FILE_STORAGE_PATH'] || '/filestore');
    fastify.decorate('fileStore', fileStore);
    fastify.decorate('documentService', DocumentService);
};

export default fp(documentPlugin);

export async function documentRoutes(server: FastifyInstance) {
    server.addSchema(uploadPendingRequestSchema);
    server.addSchema(uploadPendingResponseSchema);
    server.addSchema(updateStatusRequestSchema);
    server.addSchema(updateStatusResponseSchema);
    server.addSchema(errorSchema);
    server.addSchema(getDocumentParamsSchema);
    server.addSchema(getDocumentResponseSchema);
    server.addSchema(listDocumentsResponseSchema);

    await server.register(documentPlugin);

    server.post(
        '/api/documents',
        {
            schema: {
                body: uploadPendingRequestSchema,
                response: {
                    200: uploadPendingResponseSchema,
                    400: errorSchema,
                },
            },
        },
        uploadPendingHandler,
    );
    server.patch(
        '/api/documents/:id/status',
        {
            schema: {
                body: updateStatusRequestSchema,
                response: {
                    200: updateStatusResponseSchema,
                    500: errorSchema,
                },
            },
        },
        updateDocumentStatusHandler,
    );
    server.get(
        '/api/documents/:id',
        {
            schema: {
                params: getDocumentParamsSchema,
                response: {
                    200: getDocumentResponseSchema,
                    404: errorSchema,
                },
            },
        },
        getDocumentHandler,
    );
    server.get(
        '/api/documents',
        {
            schema: {
                response: {
                    200: listDocumentsResponseSchema,
                },
            },
        },
        listDocumentsHandler,
    );
}
