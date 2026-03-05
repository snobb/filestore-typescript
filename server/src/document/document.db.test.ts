import { describe, it, mock } from "node:test";
import assert from "node:assert";
import { create, getByID, getByUserID, update } from "./document.db";

describe("document.db", () => {
  describe("create", () => {
    it("should insert document and return with pending status", async () => {
      const mockClient = {
        query: mock.fn(() => Promise.resolve({
          rows: [{
            id: "test-uuid",
            file_name: "test.pdf",
            file_path: "/user/test.pdf",
            content_type: "application/pdf",
            file_size: 0,
            status: "pending",
            uploaded_at: null,
            updated_at: null,
            created_at: "2024-01-01",
          }],
        })),
      };

      const result = await create(
        mockClient as any,
        "user-uuid",
        "test.pdf",
        "/user/test.pdf",
        "application/pdf",
      );

      assert.equal(result.id, "test-uuid");
      assert.equal(result.file_name, "test.pdf");
      assert.equal(result.status, "pending");
      assert.equal(result.user_id, "user-uuid");
      assert.equal(result.content_type, "application/pdf");
    });
  });

  describe("getByID", () => {
    it("should return document by id", async () => {
      const mockClient = {
        query: mock.fn(() => Promise.resolve({
          rows: [{
            id: "doc-uuid",
            user_id: "user-uuid",
            file_name: "test.pdf",
            file_path: "/user/test.pdf",
            content_type: "application/pdf",
            file_size: 100,
            status: "pending",
            uploaded_at: null,
            updated_at: null,
          }],
        })),
      };

      const result = await getByID(mockClient as any, "doc-uuid");

      assert.equal(result?.id, "doc-uuid");
      assert.equal(result?.user_id, "user-uuid");
      assert.equal(result?.file_size, 100);
    });

    it("should return null when not found", async () => {
      const mockClient = {
        query: mock.fn(() => Promise.resolve({ rows: [] })),
      };

      const result = await getByID(mockClient as any, "nonexistent");
      assert.equal(result, null);
    });
  });

  describe("getByUserID", () => {
    it("should return all documents for user", async () => {
      const mockClient = {
        query: mock.fn(() => Promise.resolve({
          rows: [
            { id: "doc-1", user_id: "user-uuid", file_name: "test1.pdf", file_path: "/user/test1.pdf", content_type: "application/pdf", file_size: 100, status: "pending", uploaded_at: null, updated_at: null },
            { id: "doc-2", user_id: "user-uuid", file_name: "test2.pdf", file_path: "/user/test2.pdf", content_type: "application/pdf", file_size: 200, status: "uploaded", uploaded_at: "2024-01-01", updated_at: null },
          ],
        })),
      };

      const result = await getByUserID(mockClient as any, "user-uuid");

      assert.equal(result.length, 2);
      assert.equal(result[0].id, "doc-1");
      assert.equal(result[1].id, "doc-2");
    });
  });

  describe("update", () => {
    it("should update status", async () => {
      const mockClient = {
        query: mock.fn(() => Promise.resolve({
          rows: [{
            id: "doc-uuid",
            user_id: "user-uuid",
            file_name: "test.pdf",
            file_path: "/user/test.pdf",
            content_type: "application/pdf",
            file_size: 100,
            checksum: "abc123",
            status: "uploaded",
            uploaded_at: null,
            updated_at: "2024-01-02",
            created_at: "2024-01-01",
          }],
        })),
      };

      const result = await update(mockClient as any, "doc-uuid", {
        status: "uploaded",
      });

      assert.equal(result.status, "uploaded");
      assert.equal(result.checksum, "abc123");
    });

    it("should update multiple fields", async () => {
      const mockClient = {
        query: mock.fn(() => Promise.resolve({
          rows: [{
            id: "doc-uuid",
            user_id: "user-uuid",
            file_name: "test.pdf",
            file_path: "/user/test.pdf",
            content_type: "application/pdf",
            file_size: 500,
            checksum: "def456",
            status: "verified",
            uploaded_at: null,
            updated_at: "2024-01-02",
            created_at: "2024-01-01",
          }],
        })),
      };

      const result = await update(mockClient as any, "doc-uuid", {
        status: "verified",
        checksum: "def456",
        fileSize: 500,
      });

      assert.equal(result.status, "verified");
      assert.equal(result.file_size, 500);
      assert.equal(result.checksum, "def456");
    });
  });
});
