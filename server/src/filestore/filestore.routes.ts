import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { DiskFileStore, FileStore } from './disk';
import { DOWNLOAD_PREFIX, downloadHandler, UPLOAD_PREFIX, uploadHandler } from './filestore.controller';
import { $ref, filestoreSchemas } from './filestore.schema';

declare module 'fastify' {
    interface FastifyInstance {
        fileStore: FileStore;
    }
}

const filestorePlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const fileStore = new DiskFileStore(process.env.FILE_STORAGE_PATH || '/filestore');
    fastify.decorate('fileStore', fileStore);

    fastify.addContentTypeParser('*', (_request, payload, done) => {
        done(null, payload);
    });
};

export default fp(filestorePlugin);

export async function filestoreRoutes(server: FastifyInstance) {
    for (const schema of filestoreSchemas) {
        server.addSchema(schema);
    }

    await server.register(filestorePlugin);

    server.post(
        `${UPLOAD_PREFIX}/*`,
        {
            schema: {
                response: {
                    200: $ref('fileInfo'),
                    400: $ref('error'),
                    500: $ref('error'),
                },
            },
        },
        uploadHandler,
    );
    server.get(
        `${DOWNLOAD_PREFIX}/*`,
        {
            schema: {
                response: {
                    400: $ref('error'),
                    404: $ref('error'),
                },
            },
        },
        downloadHandler,
    );
}
