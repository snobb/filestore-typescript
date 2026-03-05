import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface FileInfo {
    path: string;
    check_sum: string;
    file_size: number;
}

export interface FileStore {
    save(path: string, data: AsyncIterable<Uint8Array>): Promise<FileInfo>;
    diskPath(path: string): string;
}

export class DiskFileStore implements FileStore {
    constructor(private baseDir: string) {}

    diskPath(filePath: string): string {
        return path.join(this.baseDir, filePath);
    }

    async save(filePath: string, data: AsyncIterable<Uint8Array>): Promise<FileInfo> {
        const fullPath = path.join(this.baseDir, filePath);
        const dirPath = path.dirname(fullPath);

        await fs.mkdir(dirPath, { recursive: true });

        const hash = crypto.createHash('sha256');
        const fileHandle = await fs.open(fullPath, 'w');

        let totalSize = 0;

        try {
            for await (const chunk of data) {
                hash.update(chunk);
                await fileHandle.write(chunk);
                totalSize += chunk.length;
            }
        } finally {
            await fileHandle.close();
        }

        return {
            path: filePath,
            check_sum: hash.digest('hex'),
            file_size: totalSize,
        };
    }
}
