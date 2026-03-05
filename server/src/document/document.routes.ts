import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { DiskFileStore, FileStore } from '../filestore/disk';
import {
    getDocumentHandler,
    listDocumentsHandler,
    updateDocumentStatusHandler,
    uploadPendingHandler,
} from './document.controller';
import { $ref, documentSchemas } from './document.schema';
import { documentService } from './document.service';

declare module 'fastify' {
    interface FastifyInstance {
        documentService: typeof documentService;
        fileStore: FileStore;
    }
}

const documentPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const fileStore = new DiskFileStore(process.env.FILE_STORAGE_PATH || '/filestore');
    fastify.decorate('fileStore', fileStore);
    fastify.decorate('documentService', documentService);
};

export default fp(documentPlugin);

export async function documentRoutes(server: FastifyInstance) {
    for (const schema of documentSchemas) {
        server.addSchema(schema);
    }

    await server.register(documentPlugin);

    server.post(
        '/api/documents',
        {
            schema: {
                body: $ref('uploadPendingRequest'),
                response: {
                    200: $ref('uploadPendingResponse'),
                    400: $ref('error'),
                },
            },
        },
        uploadPendingHandler,
    );
    server.patch(
        '/api/documents/:id/status',
        {
            schema: {
                body: $ref('updateStatusRequest'),
                response: {
                    200: $ref('updateStatusResponse'),
                    500: $ref('error'),
                },
            },
        },
        updateDocumentStatusHandler,
    );
    server.get(
        '/api/documents/:id',
        {
            schema: {
                params: $ref('getDocumentParams'),
                response: {
                    200: $ref('getDocumentResponse'),
                    404: $ref('error'),
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
                    200: $ref('listDocumentsResponse'),
                },
            },
        },
        listDocumentsHandler,
    );
}
