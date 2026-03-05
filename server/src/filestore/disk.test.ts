import * as fs from 'fs/promises';
import assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import * as os from 'os';
import * as path from 'path';
import { DiskFileStore } from './disk';

describe('disk.ts', () => {
    let tempDir: string;

    beforeEach(async () => {
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'filestore-'));
    });

    describe('diskPath', () => {
        it('should return full path', () => {
            const store = new DiskFileStore('/base');
            assert.equal(store.diskPath('user/file.pdf'), '/base/user/file.pdf');
        });
    });

    describe('save', () => {
        it('should save file and return info', async () => {
            const store = new DiskFileStore(tempDir);

            const data = (async function* () {
                yield Uint8Array.from(Buffer.from('hello world'));
            })();

            const result = await store.save('test.txt', data);

            assert.equal(result.path, 'test.txt');
            assert.equal(result.file_size, 11);
            assert.equal(result.check_sum.length, 64);

            const content = await fs.readFile(path.join(tempDir, 'test.txt'));
            assert.equal(content.toString(), 'hello world');
        });

        it('should create nested directories', async () => {
            const store = new DiskFileStore(tempDir);

            const data = (async function* () {
                yield Uint8Array.from(Buffer.from('content'));
            })();

            await store.save('nested/dir/file.txt', data);

            const content = await fs.readFile(path.join(tempDir, 'nested/dir/file.txt'));
            assert.equal(content.toString(), 'content');
        });

        it('should compute correct sha256 checksum', async () => {
            const store = new DiskFileStore(tempDir);

            const data = (async function* () {
                yield Uint8Array.from(Buffer.from('hello'));
            })();

            const result = await store.save('checksum.txt', data);

            const expectedChecksum = '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824';
            assert.equal(result.check_sum, expectedChecksum);
        });

        it('should handle multiple chunks', async () => {
            const store = new DiskFileStore(tempDir);

            const data = (async function* () {
                yield Uint8Array.from(Buffer.from('chunk1'));
                yield Uint8Array.from(Buffer.from('chunk2'));
                yield Uint8Array.from(Buffer.from('chunk3'));
            })();

            const result = await store.save('multi.txt', data);

            assert.equal(result.file_size, 18);

            const content = await fs.readFile(path.join(tempDir, 'multi.txt'));
            assert.equal(content.toString(), 'chunk1chunk2chunk3');
        });
    });
});
