import { describe, it, mock, beforeEach } from "node:test";
import assert from "node:assert";
import {
  uploadPendingHandler,
  updateDocumentStatusHandler,
  getDocumentHandler,
  listDocumentsHandler,
} from "./document.controller";

describe("document.controller", () => {
  let mockReply: any;
  let mockServer: any;

  beforeEach(() => {
    mockReply = {
      code: mock.fn(() => mockReply),
      send: mock.fn(() => mockReply),
    };
    mockServer = {
      pg: {},
      log: { error: mock.fn() },
    };
  });

  describe("uploadPendingHandler", () => {
    it("should return 401 if no user ID", async () => {
      const mockRequest: any = {
        headers: {},
        body: { file_name: "test.pdf", content_type: "application/pdf" },
        server: mockServer,
      };

      await uploadPendingHandler(mockRequest, mockReply);

      assert.equal(mockReply.code.mock.calls[0]?.arguments[0], 401);
      assert.deepEqual(mockReply.send.mock.calls[0]?.arguments[0], { error: "unauthorized" });
    });

    it("should return 400 if no file_name", async () => {
      const mockRequest: any = {
        headers: { "x-user-id": "user-uuid" },
        body: { content_type: "application/pdf" },
        server: mockServer,
      };

      await uploadPendingHandler(mockRequest, mockReply);

      assert.equal(mockReply.code.mock.calls[0]?.arguments[0], 400);
    });

    it("should reject path traversal in file_name", async () => {
      const mockRequest: any = {
        headers: { "x-user-id": "user-uuid" },
        body: { file_name: "../etc/passwd", content_type: "application/pdf" },
        server: mockServer,
      };

      await uploadPendingHandler(mockRequest, mockReply);

      assert.equal(mockReply.code.mock.calls[0]?.arguments[0], 400);
    });

    it("should return 400 if file_name contains ..", async () => {
      const mockRequest: any = {
        headers: { "x-user-id": "user-uuid" },
        body: { file_name: "../etc/passwd", content_type: "application/pdf" },
        server: mockServer,
      };

      await uploadPendingHandler(mockRequest, mockReply);

      assert.equal(mockReply.code.mock.calls[0]?.arguments[0], 400);
    });

    it("should create document and return upload URL", async () => {
      const mockDoc = {
        id: "doc-uuid",
        user_id: "user-uuid",
        file_name: "test.pdf",
        file_path: "user-uuid/doc-uuid_test.pdf",
        content_type: "application/pdf",
        status: "pending",
      };

      mockServer.pg.connect = mock.fn(() => Promise.resolve({
        query: mock.fn(() => Promise.resolve({ rows: [mockDoc] })),
        release: mock.fn(),
      }));

      const mockRequest: any = {
        headers: { "x-user-id": "user-uuid" },
        body: { file_name: "test.pdf", content_type: "application/pdf" },
        server: mockServer,
      };

      await uploadPendingHandler(mockRequest, mockReply);

      assert.equal(mockReply.code.mock.calls[0]?.arguments[0], 200);
      const response = mockReply.send.mock.calls[0]?.arguments[0];
      assert.equal(response.id, "doc-uuid");
      assert.match(response.upload_url, /\/file_store\/upload/);
      assert.match(response.status_url, /\/api\/documents\/.*\/status/);
    });
  });

  describe("updateDocumentStatusHandler", () => {
    it("should return 401 if no user ID", async () => {
      const mockRequest: any = {
        headers: {},
        params: { id: "doc-uuid" },
        body: { status: "uploaded", file_size: 100, checksum: "abc" },
        server: mockServer,
      };

      await updateDocumentStatusHandler(mockRequest, mockReply);

      assert.equal(mockReply.code.mock.calls[0]?.arguments[0], 401);
    });

    it("should return 404 if document not found", async () => {
      mockServer.pg.connect = mock.fn(() => Promise.resolve({
        query: mock.fn(() => Promise.resolve({ rows: [] })),
        release: mock.fn(),
      }));

      const mockRequest: any = {
        headers: { "x-user-id": "user-uuid" },
        params: { id: "nonexistent" },
        body: { status: "uploaded", file_size: 100, checksum: "abc" },
        server: mockServer,
      };

      await updateDocumentStatusHandler(mockRequest, mockReply);

      assert.equal(mockReply.code.mock.calls[0]?.arguments[0], 404);
    });

    it("should return 403 if user does not own document", async () => {
      mockServer.pg.connect = mock.fn(() => Promise.resolve({
        query: mock.fn(() => Promise.resolve({
          rows: [{ id: "doc-uuid", user_id: "other-user" }],
        })),
        release: mock.fn(),
      }));

      const mockRequest: any = {
        headers: { "x-user-id": "user-uuid" },
        params: { id: "doc-uuid" },
        body: { status: "uploaded", file_size: 100, checksum: "abc" },
        server: mockServer,
      };

      await updateDocumentStatusHandler(mockRequest, mockReply);

      assert.equal(mockReply.code.mock.calls[0]?.arguments[0], 403);
    });

    it("should update document status", async () => {
      let queryCallCount = 0;
      mockServer.pg.connect = mock.fn(() => {
        queryCallCount++;
        const mockDoc = { id: "doc-uuid", user_id: "user-uuid", status: "pending" };
        return Promise.resolve({
          query: mock.fn(() => Promise.resolve({ rows: [mockDoc] })),
          release: mock.fn(),
        });
      });

      const mockRequest: any = {
        headers: { "x-user-id": "user-uuid" },
        params: { id: "doc-uuid" },
        body: { status: "uploaded", file_size: 100, checksum: "abc123" },
        server: mockServer,
      };

      await updateDocumentStatusHandler(mockRequest, mockReply);

      assert.equal(mockReply.code.mock.calls[0]?.arguments[0], 200);
    });
  });

  describe("getDocumentHandler", () => {
    it("should return 401 if no user ID", async () => {
      const mockRequest: any = {
        headers: {},
        params: { id: "doc-uuid" },
        server: mockServer,
      };

      await getDocumentHandler(mockRequest, mockReply);

      assert.equal(mockReply.code.mock.calls[0]?.arguments[0], 401);
    });

    it("should return 404 if document not found", async () => {
      mockServer.pg.connect = mock.fn(() => Promise.resolve({
        query: mock.fn(() => Promise.resolve({ rows: [] })),
        release: mock.fn(),
      }));

      const mockRequest: any = {
        headers: { "x-user-id": "user-uuid" },
        params: { id: "nonexistent" },
        server: mockServer,
      };

      await getDocumentHandler(mockRequest, mockReply);

      assert.equal(mockReply.code.mock.calls[0]?.arguments[0], 404);
    });

    it("should return 403 if user does not own document", async () => {
      mockServer.pg.connect = mock.fn(() => Promise.resolve({
        query: mock.fn(() => Promise.resolve({
          rows: [{ id: "doc-uuid", user_id: "other-user" }],
        })),
        release: mock.fn(),
      }));

      const mockRequest: any = {
        headers: { "x-user-id": "user-uuid" },
        params: { id: "doc-uuid" },
        server: mockServer,
      };

      await getDocumentHandler(mockRequest, mockReply);

      assert.equal(mockReply.code.mock.calls[0]?.arguments[0], 403);
    });

    it("should return document if owned by user", async () => {
      const mockDoc = {
        id: "doc-uuid",
        user_id: "user-uuid",
        file_name: "test.pdf",
        file_path: "/user/test.pdf",
        content_type: "application/pdf",
        file_size: 100,
        status: "pending",
        uploaded_at: undefined,
        updated_at: undefined,
      };
      mockServer.pg.connect = mock.fn(() => Promise.resolve({
        query: mock.fn(() => Promise.resolve({ rows: [mockDoc] })),
        release: mock.fn(),
      }));

      const mockRequest: any = {
        headers: { "x-user-id": "user-uuid" },
        params: { id: "doc-uuid" },
        server: mockServer,
      };

      await getDocumentHandler(mockRequest, mockReply);

      assert.equal(mockReply.code.mock.calls[0]?.arguments[0], 200);
    });
  });

  describe("listDocumentsHandler", () => {
    it("should return 401 if no user ID", async () => {
      const mockRequest: any = {
        headers: {},
        server: mockServer,
      };

      await listDocumentsHandler(mockRequest, mockReply);

      assert.equal(mockReply.code.mock.calls[0]?.arguments[0], 401);
    });

    it("should return list of documents", async () => {
      const mockDocs = [
        { id: "doc-1", user_id: "user-uuid" },
        { id: "doc-2", user_id: "user-uuid" },
      ];
      mockServer.pg.connect = mock.fn(() => Promise.resolve({
        query: mock.fn(() => Promise.resolve({ rows: mockDocs })),
        release: mock.fn(),
      }));

      const mockRequest: any = {
        headers: { "x-user-id": "user-uuid" },
        server: mockServer,
      };

      await listDocumentsHandler(mockRequest, mockReply);

      assert.equal(mockReply.code.mock.calls[0]?.arguments[0], 200);
      assert.equal(mockReply.send.mock.calls[0]?.arguments[0].length, 2);
    });

    it("should return empty array if no documents", async () => {
      mockServer.pg.connect = mock.fn(() => Promise.resolve({
        query: mock.fn(() => Promise.resolve({ rows: [] })),
        release: mock.fn(),
      }));

      const mockRequest: any = {
        headers: { "x-user-id": "user-uuid" },
        server: mockServer,
      };

      await listDocumentsHandler(mockRequest, mockReply);

      assert.equal(mockReply.code.mock.calls[0]?.arguments[0], 200);
      assert.deepEqual(mockReply.send.mock.calls[0]?.arguments[0], []);
    });
  });
});
