import { type FastifyReply, type FastifyRequest } from 'fastify';
import { Pool } from 'pg';
import { type DocumentStatus, type UpdateRequest } from './document.db.ts';
import { Service as DocumentService } from './document.service.ts';

export type UploadPendingRequest = {
    file_name: string;
    content_type: string;
};

export type UploadPendingResponse = {
    id: string;
    upload_url: string;
    status_url: string;
};

export type UpdateStatusRequest = {
    status: string;
    file_size: number;
    checksum: string;
};

export type DocumentResponse = {
    id: string;
    user_id: string;
    file_name: string;
    file_path: string;
    file_size: number;
    content_type: string;
    checksum: string;
    status: string;
    uploaded_at: string | null;
    updated_at: string;
    created_at: string;
};

export type GetDocumentParams = {
    id: string;
};

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
    try {
        await request.server.authenticate(request, reply);
    } catch {
        return sendError(reply, 401, 'unauthorized');
    }
    if (!request.user) {
        return sendError(reply, 401, 'unauthorized');
    }

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

        reply.code(200).send(<UploadPendingResponse>{
            id: doc.id,
            upload_url: uploadPath,
            status_url: `/api/documents/${doc.id}/status`,
        });
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
    try {
        await request.server.authenticate(request, reply);
    } catch {
        return sendError(reply, 401, 'unauthorized');
    }
    if (!request.user) {
        return sendError(reply, 401, 'unauthorized');
    }

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

        if (doc.userId !== userID) {
            return sendError(reply, 403, 'access denied');
        }

        const updateReq: UpdateRequest = {
            status: status as DocumentStatus,
            fileSize: file_size,
            checksum,
        };

        const updatedDoc = await service.update(id, updateReq);

        reply.code(200).send(<DocumentResponse>{
            id: updatedDoc.id,
            user_id: updatedDoc.userId,
            status: updatedDoc.status,
            file_size: updatedDoc.fileSize,
            checksum: updatedDoc.checksum,
            file_path: updatedDoc.filePath,
            file_name: updatedDoc.fileName,
            content_type: updatedDoc.contentType,
            created_at: updatedDoc.createdAt,
            updated_at: updatedDoc.updatedAt,
            uploaded_at: updatedDoc.uploadedAt,
        });
    } catch (err) {
        request.server.log.error(err);
        return sendError(reply, 500, 'unable to update document');
    }
}

export async function getDocumentHandler(request: FastifyRequest<{ Params: GetDocumentParams }>, reply: FastifyReply) {
    try {
        await request.server.authenticate(request, reply);
    } catch {
        return sendError(reply, 401, 'unauthorized');
    }
    if (!request.user) {
        return sendError(reply, 401, 'unauthorized');
    }

    const userID = request.user.userId;

    const { id } = request.params;
    const pg = getPool(request);
    const service = new DocumentService(pg);

    try {
        const doc = await service.getByID(id);
        if (!doc) {
            return sendError(reply, 404, 'document not found');
        }

        if (doc.userId !== userID) {
            return sendError(reply, 403, 'access denied');
        }

        reply.code(200).send(<DocumentResponse>{
            id: doc.id,
            user_id: doc.userId,
            status: doc.status,
            file_size: doc.fileSize,
            checksum: doc.checksum,
            file_path: doc.filePath,
            file_name: doc.fileName,
            content_type: doc.contentType,
            created_at: doc.createdAt,
            updated_at: doc.updatedAt,
            uploaded_at: doc.uploadedAt,
        });
    } catch (err) {
        request.server.log.error(err);
        return sendError(reply, 500, 'document not found');
    }
}

export async function listDocumentsHandler(request: FastifyRequest, reply: FastifyReply) {
    try {
        await request.server.authenticate(request, reply);
    } catch {
        return sendError(reply, 401, 'unauthorized');
    }
    if (!request.user) {
        return sendError(reply, 401, 'unauthorized');
    }

    const userID = request.user.userId;

    const pg = getPool(request);
    const service = new DocumentService(pg);

    try {
        const docs = await service.getByUserID(userID);
        reply.code(200).send(
            docs.map((doc) => {
                return <DocumentResponse>{
                    id: doc.id,
                    user_id: doc.userId,
                    status: doc.status,
                    file_size: doc.fileSize,
                    checksum: doc.checksum,
                    file_path: doc.filePath,
                    file_name: doc.fileName,
                    content_type: doc.contentType,
                    created_at: doc.createdAt,
                    updated_at: doc.updatedAt,
                    uploaded_at: doc.uploadedAt,
                };
            }),
        );
    } catch (err) {
        request.server.log.error(err);
        return sendError(reply, 500, 'unable to load documents');
    }
}
