import { FastifyInstance } from "fastify";
import {
  uploadPendingHandler,
  updateDocumentStatusHandler,
  getDocumentHandler,
  listDocumentsHandler,
} from "./document.controller";

export async function documentRoutes(server: FastifyInstance) {
  server.post("/api/documents", {}, uploadPendingHandler);
  server.post("/api/documents/:id", {}, updateDocumentStatusHandler);
  server.get("/api/documents/:id", {}, getDocumentHandler);
  server.get("/api/documents", {}, listDocumentsHandler);
}
