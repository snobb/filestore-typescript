import { PoolClient } from 'pg';

export interface Document {
    id: string;
    user_id: string;
    file_name: string;
    file_path: string;
    file_size: number;
    content_type: string;
    checksum?: string;
    status: string;
    uploaded_at?: string;
    updated_at?: string;
    created_at: string;
}

export interface UploadPendingResponse {
    id: string;
    upload_url: string;
    status_url: string;
}

export interface FileInfo {
    path: string;
    check_sum: string;
    file_size: number;
}

export type DocumentStatus = 'pending' | 'uploaded' | 'verified';

export interface UpdateRequest {
    status?: DocumentStatus;
    checksum?: string;
    fileSize?: number;
}

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
        user_id: userId,
        file_name: result.rows[0].file_name,
        file_path: result.rows[0].file_path,
        file_size: result.rows[0].file_size || 0,
        content_type: result.rows[0].content_type,
        status: 'pending',
        updated_at: result.rows[0].updated_at,
        created_at: result.rows[0].created_at,
    };
}

export async function getByID(client: PoolClient, id: string) {
    const result = await client.query(
        `SELECT id, user_id, file_name, file_path, file_size, content_type, status, uploaded_at, updated_at FROM documents WHERE id = $1`,
        [id],
    );

    if (result.rows.length === 0) {
        return null;
    }

    return <Document>{
        id: result.rows[0].id,
        user_id: result.rows[0].user_id,
        file_name: result.rows[0].file_name,
        file_path: result.rows[0].file_path,
        file_size: result.rows[0].file_size || 0,
        content_type: result.rows[0].content_type,
        status: result.rows[0].status,
        uploaded_at: result.rows[0].uploaded_at,
        updated_at: result.rows[0].updated_at,
    };
}

export async function getByUserID(client: PoolClient, userID: string) {
    const result = await client.query(
        `SELECT id, user_id, file_name, file_path, file_size, content_type, status, uploaded_at, updated_at FROM documents WHERE user_id = $1`,
        [userID],
    );

    return <Document[]>result.rows;
}

export async function update(client: PoolClient, id: string, req: UpdateRequest) {
    let query = `UPDATE documents SET updated_at = NOW()`;
    let args: unknown[] = [];
    let argsNum = 0;

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

    return <Document>{
        id: result.rows[0].id,
        user_id: result.rows[0].user_id,
        file_name: result.rows[0].file_name,
        file_path: result.rows[0].file_path,
        file_size: result.rows[0].file_size || 0,
        content_type: result.rows[0].content_type,
        checksum: result.rows[0].checksum,
        status: result.rows[0].status,
        uploaded_at: result.rows[0].uploaded_at,
        updated_at: result.rows[0].updated_at,
        created_at: result.rows[0].created_at,
    };
}
