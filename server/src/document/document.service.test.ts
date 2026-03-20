import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import { Service } from './document.service.ts';

describe('document.service', () => {
    describe('create', () => {
        it('should create document and return result', async () => {
            const mockDoc = {
                id: 'test-uuid',
                file_name: 'test.pdf',
                file_path: '/user/test.pdf',
                content_type: 'application/pdf',
                file_size: 0,
                status: 'pending',
                updated_at: new Date('2024-01-01'),
                created_at: new Date('2024-01-01'),
            };

            const mockPool = {
                connect: mock.fn(() =>
                    Promise.resolve({
                        query: mock.fn(() =>
                            Promise.resolve({ rows: [mockDoc] }),
                        ),
                        release: mock.fn(),
                    }),
                ),
            };

            const service = new Service(mockPool as any);
            const result = await service.create(
                'file-id',
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
            const mockDoc = {
                id: 'doc-uuid',
                user_id: 'user-uuid',
                file_name: 'test.pdf',
                file_path: '/user/test.pdf',
                content_type: 'application/pdf',
                file_size: 100,
                status: 'pending',
                uploaded_at: null,
                updated_at: new Date('2024-01-01'),
            };
            const mockPool = {
                connect: mock.fn(() =>
                    Promise.resolve({
                        query: mock.fn(() =>
                            Promise.resolve({ rows: [mockDoc] }),
                        ),
                        release: mock.fn(),
                    }),
                ),
            };

            const service = new Service(mockPool as any);
            const result = await service.getByID('doc-uuid');

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

            const service = new Service(mockPool as any);
            const result = await service.getByID('nonexistent');

            assert.equal(result, null);
        });

        it('should return null on error', async () => {
            const mockPool = {
                connect: mock.fn(() =>
                    Promise.resolve({
                        query: mock.fn(() =>
                            Promise.reject(new Error('db error')),
                        ),
                        release: mock.fn(),
                    }),
                ),
            };

            const service = new Service(mockPool as any);
            const result = await service.getByID('doc-uuid');

            assert.equal(result, null);
        });
    });

    describe('getByUserID', () => {
        it('should return all documents for user', async () => {
            const mockDocs = [
                {
                    id: 'doc-1',
                    user_id: 'user-uuid',
                    file_name: 'test1.pdf',
                    file_path: '/user/test1.pdf',
                    content_type: 'application/pdf',
                    file_size: 100,
                    status: 'pending',
                    uploaded_at: null,
                    updated_at: new Date('2024-01-01'),
                    created_at: new Date('2024-01-01'),
                },
                {
                    id: 'doc-2',
                    user_id: 'user-uuid',
                    file_name: 'test2.pdf',
                    file_path: '/user/test2.pdf',
                    content_type: 'application/pdf',
                    file_size: 200,
                    status: 'uploaded',
                    uploaded_at: new Date('2024-01-01'),
                    updated_at: new Date('2024-01-01'),
                    created_at: new Date('2024-01-01'),
                },
            ];
            const mockPool = {
                connect: mock.fn(() =>
                    Promise.resolve({
                        query: mock.fn(() =>
                            Promise.resolve({ rows: mockDocs }),
                        ),
                        release: mock.fn(),
                    }),
                ),
            };

            const service = new Service(mockPool as any);
            const result = await service.getByUserID('user-uuid');

            assert.equal(result.length, 2);
        });
    });

    describe('update', () => {
        it('should update and return document', async () => {
            const mockDoc = {
                id: 'doc-uuid',
                status: 'uploaded',
                user_id: 'user-uuid',
                file_name: 'test.pdf',
                file_path: '/user/test.pdf',
                content_type: 'application/pdf',
                file_size: 100,
                checksum: 'abc123',
                uploaded_at: null,
                updated_at: new Date('2024-01-02'),
                created_at: new Date('2024-01-01'),
            };
            const mockPool = {
                connect: mock.fn(() =>
                    Promise.resolve({
                        query: mock.fn(() =>
                            Promise.resolve({ rows: [mockDoc] }),
                        ),
                        release: mock.fn(),
                    }),
                ),
            };

            const service = new Service(mockPool as any);
            const result = await service.update('doc-uuid', {
                status: 'uploaded',
            });

            assert.equal(result.status, 'uploaded');
        });
    });
});
