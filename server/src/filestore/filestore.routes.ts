import { type FastifyInstance, type FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { DiskFileStore } from './disk.ts';
import { DOWNLOAD_PREFIX, downloadHandler, UPLOAD_PREFIX, uploadHandler } from './filestore.controller.ts';
import { filestoreFileInfoSchema, errorSchema } from './filestore.schema.ts';

const filestorePlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const fileStore = new DiskFileStore(process.env['FILE_STORAGE_PATH'] || '/filestore');
    fastify.decorate('fileStore', fileStore);

    fastify.addContentTypeParser('*', (_request, payload, done) => {
        done(null, payload);
    });
};

export default fp(filestorePlugin);

export async function filestoreRoutes(server: FastifyInstance) {
    await server.register(filestorePlugin);

    server.post(
        `${UPLOAD_PREFIX}/*`,
        {
            schema: {
                response: {
                    200: filestoreFileInfoSchema,
                    400: errorSchema,
                    500: errorSchema,
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
                    400: errorSchema,
                    404: errorSchema,
                },
            },
        },
        downloadHandler,
    );
}
