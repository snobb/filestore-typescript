import { FastifyReply, FastifyRequest } from 'fastify';
import { Pool } from 'pg';
import { DocumentStatus, UpdateRequest } from './document.db';
import { Service as DocumentService } from './document.service';

export interface UploadPendingRequest {
    file_name: string;
    content_type: string;
}

export interface UploadPendingResponse {
    id: string;
    upload_url: string;
    status_url: string;
}

export interface UpdateStatusRequest {
    status: string;
    file_size: number;
    checksum: string;
}

export interface GetDocumentParams {
    id: string;
}

function getPool(request: FastifyRequest): Pool {
    return request.server.pg as unknown as Pool;
}

function sendError(reply: FastifyReply, statusCode: number, error: string) {
    reply.code(statusCode).send({ error });
}

export async function uploadPendingHandler(
    request: FastifyRequest<{ Body: UploadPendingRequest }>,
    reply: FastifyReply,
) {
    await request.server.authenticate(request, reply);

    const userID = request.user.userId;

    const { file_name, content_type } = request.body;

    if (!file_name || file_name.includes('..')) {
        return sendError(reply, 400, 'invalid file name');
    }

    const fileID = crypto.randomUUID();
    const sanitizedFileName = file_name.split('/').pop() || file_name;
    const storePath = `${userID}/${fileID}_${sanitizedFileName}`;
    const uploadPath = `/file_store/uploads/${storePath}`;

    try {
        const pg = getPool(request);
        const service = new DocumentService(pg);
        const doc = await service.create(fileID, userID, file_name, storePath, content_type);

        const response: UploadPendingResponse = {
            id: doc.id,
            upload_url: uploadPath,
            status_url: `/api/documents/${doc.id}/status`,
        };

        reply.code(200).send(response);
    } catch (err) {
        request.server.log.error(err);
        return sendError(reply, 500, 'unable to write to db');
    }
}

export async function updateDocumentStatusHandler(
    request: FastifyRequest<{
        Params: GetDocumentParams;
        Body: UpdateStatusRequest;
    }>,
    reply: FastifyReply,
) {
    await request.server.authenticate(request, reply);

    const userID = request.user.userId;

    const { id } = request.params;
    const { status, file_size, checksum } = request.body;
    const pg = getPool(request);
    const service = new DocumentService(pg);

    try {
        const doc = await service.getByID(id);
        if (!doc) {
            return sendError(reply, 404, 'document not found');
        }

        if (doc.user_id !== userID) {
            return sendError(reply, 403, 'access denied');
        }

        const updateReq: UpdateRequest = {
            status: status as DocumentStatus,
            fileSize: file_size,
            checksum,
        };

        const updatedDoc = await service.update(id, updateReq);

        reply.code(200).send(updatedDoc);
    } catch (err) {
        request.server.log.error(err);
        return sendError(reply, 500, 'unable to update document');
    }
}

export async function getDocumentHandler(request: FastifyRequest<{ Params: GetDocumentParams }>, reply: FastifyReply) {
    await request.server.authenticate(request, reply);

    const userID = request.user.userId;

    const { id } = request.params;
    const pg = getPool(request);
    const service = new DocumentService(pg);

    try {
        const doc = await service.getByID(id);
        if (!doc) {
            return sendError(reply, 404, 'document not found');
        }

        if (doc.user_id !== userID) {
            return sendError(reply, 403, 'access denied');
        }

        reply.code(200).send(doc);
    } catch (err) {
        request.server.log.error(err);
        return sendError(reply, 500, 'document not found');
    }
}

export async function listDocumentsHandler(request: FastifyRequest, reply: FastifyReply) {
    await request.server.authenticate(request, reply);

    const userID = request.user.userId;

    const pg = getPool(request);
    const service = new DocumentService(pg);

    try {
        const docs = await service.getByUserID(userID);
        reply.code(200).send(docs || []);
    } catch (err) {
        request.server.log.error(err);
        return sendError(reply, 500, 'unable to load documents');
    }
}
