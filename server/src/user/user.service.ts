import { Pool } from 'pg';
import crypto from 'node:crypto';
import { create, getByEmail, getByID, User } from './user.db';

const pepper = (() => {
    const p = process.env.DATABASE_PEPPER;
    if (!p || p.trim() === '') {
        console.error('CRITICAL ERROR: DATABASE_PEPPER environment variable is not set.');
        process.exit(1);
    }
    return p;
})();

export class Service {
    constructor(private db: Pool) {}

    async create(email: string, password: string): Promise<User> {
        const { hash, salt, iterations } = hashPassword(password);
        const client = await this.db.connect();
        try {
            return await create(client, email, hash, salt, iterations);
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

function hashPassword(password: string, iterations: number = 21000) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password + pepper, salt, iterations, 64, 'sha512').toString('hex');
    return { hash, salt, iterations };
}

function verifyPassword({
    password,
    salt,
    hash,
    iterations,
}: {
    password: string;
    salt: string;
    hash: string;
    iterations: number;
}) {
    const candidateHash = crypto.pbkdf2Sync(password + pepper, salt, iterations, 64, 'sha512').toString('hex');

    if (candidateHash.length !== hash.length) {
        return false;
    }

    return crypto.timingSafeEqual(Buffer.from(candidateHash), Buffer.from(hash));
}
