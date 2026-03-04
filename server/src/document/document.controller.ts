import { FastifyRequest } from "fastify";
import { Document } from "./document.db";

export interface uploadPendingRequest {
  file_name: string;
  content_type: string;
}

export interface uploadPendingResponse {
  id: string;
  upload_url: string;
  status_url: string;
}

export interface updateStatusRequest {
  status: string;
  file_size: number;
  checksum: string;
}

export async function uploadPendingHandler(
  req: FastifyRequest<{ Body: uploadPendingRequest }>,
) {}

export async function updateDocumentStatusHandler(
  req: FastifyRequest<{ Body: updateStatusRequest }>,
) {}

export async function getDocumentHandler(req: FastifyRequest) {}

export async function listDocumentsHandler(req: FastifyRequest) {}
