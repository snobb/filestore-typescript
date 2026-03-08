import { Pool } from 'pg';
import { create, Document, getByID, getByUserID, update, UpdateRequest } from './document.db';

export class Service {
    constructor(private db: Pool) {}

    async create(
        fileId: string,
        userId: string,
        fileName: string,
        filePath: string,
        contentType: string,
    ): Promise<Document> {
        const client = await this.db.connect();
        try {
            return await create(client, fileId, userId, fileName, filePath, contentType);
        } finally {
            client.release();
        }
    }

    async getByID(id: string): Promise<Document | null> {
        const client = await this.db.connect();
        try {
            return await getByID(client, id);
        } catch (err) {
            return null;
        } finally {
            client.release();
        }
    }

    async getByUserID(userID: string): Promise<Document[]> {
        const client = await this.db.connect();
        try {
            return await getByUserID(client, userID);
        } finally {
            client.release();
        }
    }

    async update(id: string, req: UpdateRequest): Promise<Document> {
        const client = await this.db.connect();
        try {
            return await update(client, id, req);
        } finally {
            client.release();
        }
    }
}
