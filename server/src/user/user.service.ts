import { Pool } from 'pg';
import crypto from 'node:crypto';
import { create, getByEmail, getByID, User } from './user.db';
import argon2 from 'argon2';

const defaultMemory = 65536;
const defaultThreads = 2;

const pepper = (() => {
    const p = process.env.DATABASE_PEPPER;
    if (!p || p.trim() === '') {
        console.error('CRITICAL ERROR: DATABASE_PEPPER environment variable is not set.');
        process.exit(1);
    }
    return p;
})();

interface VerifyPasswordRequest {
    password: string;
    salt: string;
    hash: string;
    iterations: number;
    memory?: number;
    threads?: number;
}

export interface HashPasswordResponse {
    hash: string;
    salt: string;
    iterations: number;
    memory: number;
    threads: number;
}

export class Service {
    constructor(private db: Pool) {}

    async create(email: string, password: string): Promise<User> {
        const { hash, salt, iterations, memory, threads } = await hashPassword(password);
        const client = await this.db.connect();
        try {
            return await create(client, email, hash, salt, iterations, memory, threads);
        } finally {
            client.release();
        }
    }

    async getByEmail(email: string): Promise<User | null> {
        const client = await this.db.connect();
        try {
            return await getByEmail(client, email);
        } catch (err) {
            return null;
        } finally {
            client.release();
        }
    }

    async getByID(id: string): Promise<User | null> {
        const client = await this.db.connect();
        try {
            return await getByID(client, id);
        } catch (err) {
            return null;
        } finally {
            client.release();
        }
    }

    async verifyLogin(email: string, password: string): Promise<User | null> {
        const user = await this.getByEmail(email);
        if (!user) {
            return null;
        }

        const isValid = verifyPassword({
            password,
            salt: user.salt,
            hash: user.hashed_password,
            iterations: user.iterations,
        });

        if (!isValid) {
            return null;
        }

        return user;
    }
}

/**
 * Generates an Argon2id hash.
 * Returns the hash, salt, and iterations as requested.
 * Note: Memory and Parallelism are kept as internal constants.
 */
export async function hashPassword(password: string, iterations: number = 3): Promise<HashPasswordResponse> {
    const salt = crypto.randomBytes(16);

    const memoryCost = defaultMemory;
    const parallelism = defaultThreads;

    const hash = await argon2.hash(password + pepper, {
        type: argon2.argon2id,
        timeCost: iterations,
        memoryCost: memoryCost,
        parallelism: parallelism,
        salt: salt,
        raw: true, // raw Buffer to convert to hex manually
    });

    return {
        hash: hash.toString('hex'),
        salt: salt.toString('hex'),
        iterations: iterations,
        memory: memoryCost,
        threads: parallelism,
    };
}

export async function verifyPassword({ password, salt, hash, iterations, memory, threads }: VerifyPasswordRequest) {
    const saltBuffer = Buffer.from(salt, 'hex');
    const hashBuffer = Buffer.from(hash, 'hex');

    memory = memory || defaultMemory;
    threads = threads || defaultThreads;

    // Verify the hash - must use exact parameters including memory and parallelism.
    const candidateHash = await argon2.hash(password + pepper, {
        type: argon2.argon2id,
        timeCost: iterations,
        memoryCost: memory,
        parallelism: threads,
        salt: saltBuffer,
        raw: true,
    });

    return crypto.timingSafeEqual(hashBuffer, candidateHash);
}
