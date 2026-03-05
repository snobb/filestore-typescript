import { Pool } from "pg";
import {
  Document,
  create,
  getByID,
  getByUserID,
  update,
  UpdateRequest,
} from "./document.db";

export const documentService = {
  async create(
    pg: Pool,
    userId: string,
    fileName: string,
    filePath: string,
    contentType: string,
  ): Promise<Document> {
    const client = await pg.connect();
    try {
      return await create(client, userId, fileName, filePath, contentType);
    } finally {
      client.release();
    }
  },

  async getByID(pg: Pool, id: string): Promise<Document | null> {
    const client = await pg.connect();
    try {
      return await getByID(client, id);
    } catch (err) {
      return null;
    } finally {
      client.release();
    }
  },

  async getByUserID(pg: Pool, userID: string): Promise<Document[]> {
    const client = await pg.connect();
    try {
      return await getByUserID(client, userID);
    } finally {
      client.release();
    }
  },

  async update(pg: Pool, id: string, req: UpdateRequest): Promise<Document> {
    const client = await pg.connect();
    try {
      return await update(client, id, req);
    } finally {
      client.release();
    }
  },
};
