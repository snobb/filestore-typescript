import { FastifyReply, FastifyRequest } from 'fastify';
import * as fs from 'fs';
import { Readable } from 'node:stream';

export const UPLOAD_PREFIX = '/file_store/uploads';
export const DOWNLOAD_PREFIX = '/file_store/downloads';

export async function uploadHandler(request: FastifyRequest, reply: FastifyReply) {
    const urlPath = request.url;
    const filePath = urlPath.replace(UPLOAD_PREFIX, '');
    if (!filePath) {
        return reply.code(400).send({ error: 'path required' });
    }

    const unescapedPath = decodeURIComponent(filePath);

    try {
        const fileStore = request.server.fileStore;
        const stream = request.body as Readable;

        const chunks: Uint8Array[] = [];
        for await (const chunk of stream) {
            chunks.push(chunk);
        }

        const info = await fileStore.save(
            unescapedPath,
            (async function* () {
                for (const chunk of chunks) {
                    yield chunk;
                }
            })(),
        );

        reply.code(200).send(info);
    } catch (err) {
        request.server.log.error(err);
        reply.code(500).send({ error: 'failed to save file' });
    }
}

export async function downloadHandler(request: FastifyRequest, reply: FastifyReply) {
    const urlPath = request.url;
    const filePath = decodeURIComponent(urlPath.replace(DOWNLOAD_PREFIX, ''));
    if (!filePath) {
        return reply.code(400).send({ error: 'path required' });
    }

    const fileStore = request.server.fileStore;
    const fullPath = fileStore.diskPath(filePath);
    request.log.info(fullPath);

    try {
        await fs.promises.access(fullPath);
        reply.header('Content-Type', 'application/octet-stream');
        return reply.send(fs.createReadStream(fullPath));
    } catch {
        return reply.code(404).send({ error: 'file not found' });
    }
}
