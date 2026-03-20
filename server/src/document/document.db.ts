import { type PoolClient } from 'pg';

export type Document = {
    id: string;
    userId: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    contentType: string;
    checksum?: string;
    status: string;
    uploadedAt?: string;
    updatedAt?: string;
    createdAt: string;
};

export type UploadPendingResponse = {
    id: string;
    uploadUrl: string;
    statusUrl: string;
};

export type FileInfo = {
    path: string;
    checksum: string;
    fileSize: number;
};

export type DocumentStatus = 'pending' | 'uploaded' | 'verified';

export type UpdateRequest = {
    status?: DocumentStatus;
    checksum?: string;
    fileSize?: number;
};

export async function create(
    client: PoolClient,
    fileId: string,
    userId: string,
    fileName: string,
    filePath: string,
    contentType: string,
) {
    const result = await client.query(
        `INSERT INTO documents (id, user_id, file_name, file_path, content_type, file_size) VALUES ($1, $2, $3, $4, $5, 0)
        ON CONFLICT (user_id, file_name)
        DO UPDATE SET
            file_path = EXCLUDED.file_path,
            content_type = EXCLUDED.content_type,
            file_size = EXCLUDED.file_size,
            updated_at = NOW()
      RETURNING id, file_name, file_path, file_size, content_type, updated_at, created_at`,
        [fileId, userId, fileName, filePath, contentType],
    );

    return <Document>{
        id: result.rows[0].id,
        userId: userId,
        fileName: result.rows[0].file_name,
        filePath: result.rows[0].file_path,
        fileSize: result.rows[0].file_size || 0,
        contentType: result.rows[0].content_type,
        status: 'pending',
        updatedAt: result.rows[0].updated_at.toISOString(),
        createdAt: result.rows[0].created_at.toISOString(),
    };
}

export async function getByID(client: PoolClient, id: string) {
    const result = await client.query(
        `SELECT id, user_id, file_name, file_path, file_size, content_type, status,
        uploaded_at, updated_at FROM documents WHERE id = $1`,
        [id],
    );

    if (result.rows.length === 0) {
        return null;
    }

    return <Document>{
        id: result.rows[0].id,
        userId: result.rows[0].user_id,
        fileName: result.rows[0].file_name,
        filePath: result.rows[0].file_path,
        fileSize: result.rows[0].file_size || 0,
        contentType: result.rows[0].content_type,
        status: result.rows[0].status,
        uploadedAt: result.rows[0].uploaded_at?.toISOString() || undefined,
        updatedAt: result.rows[0].updated_at?.toISOString() || undefined,
    };
}

export async function getByUserID(client: PoolClient, userID: string) {
    const result = await client.query(
        `SELECT id, user_id, file_name, file_path, file_size, content_type, status,
        uploaded_at, updated_at, created_at FROM documents WHERE user_id = $1`,
        [userID],
    );

    return result.rows.map((row) => <Document>{
        id: row.id,
        userId: row.user_id,
        fileName: row.file_name,
        filePath: row.file_path,
        fileSize: row.file_size || 0,
        contentType: row.content_type,
        status: row.status,
        uploadedAt: row.uploaded_at?.toISOString() || undefined,
        updatedAt: row.updated_at?.toISOString() || undefined,
        createdAt: row.created_at?.toISOString() || '',
    });
}

export async function update(client: PoolClient, id: string, req: UpdateRequest) {
    let query = `UPDATE documents SET updated_at = NOW()`;
    const args: unknown[] = [];
    let argsNum = 0;

    if (req.status === 'uploaded' || req.status === 'verified') {
        query += `, uploaded_at = NOW()`;
    }

    if (req.status) {
        query += `, status = $${++argsNum}`;
        args.push(req.status);
    }

    if (req.checksum) {
        query += `, checksum = $${++argsNum}`;
        args.push(req.checksum);
    }

    if (req.fileSize) {
        query += `, file_size = $${++argsNum}`;
        args.push(req.fileSize);
    }

    query += ` WHERE id = $${++argsNum} RETURNING id, user_id, file_name, file_path, file_size,
      content_type, COALESCE(checksum, '') as checksum, status, uploaded_at, updated_at, created_at`;
    args.push(id);

    const result = await client.query(query, args);
    const row = result.rows[0];

    return <Document>{
        id: row.id,
        userId: row.user_id,
        fileName: row.file_name,
        filePath: row.file_path,
        fileSize: row.file_size || 0,
        contentType: row.content_type,
        checksum: row.checksum,
        status: row.status,
        uploadedAt: row.uploaded_at?.toISOString() || undefined,
        updatedAt: row.updated_at.toISOString(),
        createdAt: row.created_at.toISOString(),
    };
}
