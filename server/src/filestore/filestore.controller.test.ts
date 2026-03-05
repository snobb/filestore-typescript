import * as fs from 'fs/promises';
import assert from 'node:assert';
import { beforeEach, describe, it, mock } from 'node:test';
import * as os from 'os';
import * as path from 'path';
import { DiskFileStore } from './disk';
import { DOWNLOAD_PREFIX, downloadHandler, UPLOAD_PREFIX, uploadHandler } from './filestore.controller';

describe('filestore.controller', () => {
    let mockReply: any;
    let mockServer: any;
    let tempDir: string;

    beforeEach(async () => {
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'filestore-'));
        mockReply = {
            code: mock.fn(() => mockReply),
            send: mock.fn(() => mockReply),
            header: mock.fn(() => mockReply),
        };
        mockServer = {
            fileStore: new DiskFileStore(tempDir),
            log: { error: mock.fn(), info: mock.fn() },
        };
    });

    describe('uploadHandler', () => {
        it('should return 400 if no path', async () => {
            const mockRequest: any = {
                url: UPLOAD_PREFIX,
                body: null,
                server: mockServer,
            };

            await uploadHandler(mockRequest, mockReply);

            assert.equal(mockReply.code.mock.calls[0]?.arguments[0], 400);
            assert.deepEqual(mockReply.send.mock.calls[0]?.arguments[0], { error: 'path required' });
        });

        it('should save file and return info', async () => {
            const mockRequest: any = {
                url: `${UPLOAD_PREFIX}/test.txt`,
                body: {
                    [Symbol.asyncIterator]: async function* () {
                        yield Uint8Array.from(Buffer.from('hello'));
                    },
                },
                server: mockServer,
            };

            await uploadHandler(mockRequest, mockReply);

            assert.equal(mockReply.code.mock.calls[0]?.arguments[0], 200);
            const response = mockReply.send.mock.calls[0]?.arguments[0];
            assert.equal(response.path, '/test.txt');
            assert.equal(response.file_size, 5);
        });

        it('should decode URI components in path', async () => {
            const mockRequest: any = {
                url: `${UPLOAD_PREFIX}/user%2Ffile.txt`,
                body: {
                    [Symbol.asyncIterator]: async function* () {
                        yield Uint8Array.from(Buffer.from('content'));
                    },
                },
                server: mockServer,
            };

            await uploadHandler(mockRequest, mockReply);

            assert.equal(mockReply.code.mock.calls[0]?.arguments[0], 200);
            const response = mockReply.send.mock.calls[0]?.arguments[0];
            assert.equal(response.path, '/user/file.txt');
        });
    });

    describe('downloadHandler', () => {
        it('should return 400 if no path', async () => {
            const mockRequest: any = {
                url: DOWNLOAD_PREFIX,
                server: mockServer,
            };

            await downloadHandler(mockRequest, mockReply);

            assert.equal(mockReply.code.mock.calls[0]?.arguments[0], 400);
        });

        it('should return 404 if file not found', async () => {
            const mockRequest: any = {
                url: `${DOWNLOAD_PREFIX}/nonexistent.txt`,
                server: mockServer,
                log: { info: mock.fn() },
            };

            await downloadHandler(mockRequest, mockReply);

            assert.equal(mockReply.code.mock.calls[0]?.arguments[0], 404);
            assert.deepEqual(mockReply.send.mock.calls[0]?.arguments[0], { error: 'file not found' });
        });

        it('should return file if exists', async () => {
            await fs.writeFile(path.join(tempDir, 'existing.txt'), 'content');

            const mockRequest: any = {
                url: `${DOWNLOAD_PREFIX}/existing.txt`,
                server: mockServer,
                log: { info: mock.fn() },
            };

            await downloadHandler(mockRequest, mockReply);

            assert.equal(mockReply.header.mock.calls[0]?.arguments[0], 'Content-Type');
        });

        it('should decode URI components in path', async () => {
            await fs.mkdir(path.join(tempDir, 'user'), { recursive: true });
            await fs.writeFile(path.join(tempDir, 'user/file.txt'), 'content');

            const mockRequest: any = {
                url: `${DOWNLOAD_PREFIX}/user%2Ffile.txt`,
                server: mockServer,
                log: { info: mock.fn() },
            };

            await downloadHandler(mockRequest, mockReply);

            assert.equal(mockReply.header.mock.calls[0]?.arguments[0], 'Content-Type');
        });
    });
});
