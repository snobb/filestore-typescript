import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import { documentService } from './document.service';

describe('document.service', () => {
    describe('create', () => {
        it('should create document and return result', async () => {
            const mockDoc = {
                id: 'test-uuid',
                user_id: 'user-uuid',
                file_name: 'test.pdf',
                file_path: '/user/test.pdf',
                content_type: 'application/pdf',
                file_size: 0,
                status: 'pending',
            };

            const mockPool = {
                connect: mock.fn(() =>
                    Promise.resolve({
                        query: mock.fn(() => Promise.resolve({ rows: [mockDoc] })),
                        release: mock.fn(),
                    }),
                ),
            };

            const result = await documentService.create(
                mockPool as any,
                'user-uuid',
                'test.pdf',
                '/user/test.pdf',
                'application/pdf',
            );

            assert.equal(result.id, 'test-uuid');
            assert.equal(result.status, 'pending');
        });
    });

    describe('getByID', () => {
        it('should return document when found', async () => {
            const mockDoc = { id: 'doc-uuid', user_id: 'user-uuid' };
            const mockPool = {
                connect: mock.fn(() =>
                    Promise.resolve({
                        query: mock.fn(() => Promise.resolve({ rows: [mockDoc] })),
                        release: mock.fn(),
                    }),
                ),
            };

            const result = await documentService.getByID(mockPool as any, 'doc-uuid');

            assert.equal(result?.id, 'doc-uuid');
        });

        it('should return null when not found', async () => {
            const mockPool = {
                connect: mock.fn(() =>
                    Promise.resolve({
                        query: mock.fn(() => Promise.resolve({ rows: [] })),
                        release: mock.fn(),
                    }),
                ),
            };

            const result = await documentService.getByID(mockPool as any, 'nonexistent');

            assert.equal(result, null);
        });

        it('should return null on error', async () => {
            const mockPool = {
                connect: mock.fn(() =>
                    Promise.resolve({
                        query: mock.fn(() => Promise.reject(new Error('db error'))),
                        release: mock.fn(),
                    }),
                ),
            };

            const result = await documentService.getByID(mockPool as any, 'doc-uuid');

            assert.equal(result, null);
        });
    });

    describe('getByUserID', () => {
        it('should return all documents for user', async () => {
            const mockDocs = [
                { id: 'doc-1', user_id: 'user-uuid' },
                { id: 'doc-2', user_id: 'user-uuid' },
            ];
            const mockPool = {
                connect: mock.fn(() =>
                    Promise.resolve({
                        query: mock.fn(() => Promise.resolve({ rows: mockDocs })),
                        release: mock.fn(),
                    }),
                ),
            };

            const result = await documentService.getByUserID(mockPool as any, 'user-uuid');

            assert.equal(result.length, 2);
        });
    });

    describe('update', () => {
        it('should update and return document', async () => {
            const mockDoc = { id: 'doc-uuid', status: 'uploaded' };
            const mockPool = {
                connect: mock.fn(() =>
                    Promise.resolve({
                        query: mock.fn(() => Promise.resolve({ rows: [mockDoc] })),
                        release: mock.fn(),
                    }),
                ),
            };

            const result = await documentService.update(mockPool as any, 'doc-uuid', { status: 'uploaded' });

            assert.equal(result.status, 'uploaded');
        });
    });
});
