import { PoolClient } from 'pg';

export interface User {
    id: string;
    email: string;
    hashed_password: string;
    salt: string;
    iterations: number;
    created_at: string;
    updated_at: string;
}

export async function create(
    client: PoolClient,
    email: string,
    passwordHash: string,
    salt: string,
    iterations: number,
    memory: number,
    threads: number,
) {
    const id = crypto.randomUUID();
    const username = email.split('@')[0];
    const result = await client.query(
        `INSERT INTO users (id, email, username, hashed_password, salt, iterations, memory, threads)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (email)
         DO UPDATE SET
             hashed_password = EXCLUDED.hashed_password,
             salt = EXCLUDED.salt,
             iterations = EXCLUDED.iterations,
             memory = EXCLUDED.memory,
             threads = EXCLUDED.threads
         RETURNING id, email, created_at, updated_at`,
        [id, email, username, passwordHash, salt, iterations, memory, threads],
    );

    return <User>{
        id: result.rows[0].id,
        email: result.rows[0].email,
        created_at: result.rows[0].created_at,
        updated_at: result.rows[0].updated_at,
    };
}

export async function getByEmail(client: PoolClient, email: string) {
    const result = await client.query(
        `SELECT id, email, hashed_password, salt, iterations, memory, threads, updated_at, created_at FROM users WHERE email = $1`,
        [email],
    );

    if (result.rows.length === 0) {
        return null;
    }

    return <User>{
        id: result.rows[0].id,
        email: result.rows[0].email,
        hashed_password: result.rows[0].hashed_password,
        salt: result.rows[0].salt,
        iterations: result.rows[0].iterations,
        memory: result.rows[0].memory,
        threads: result.rows[0].threads,
        updated_at: result.rows[0].updated_at,
        created_at: result.rows[0].created_at,
    };
}

export async function getByID(client: PoolClient, id: string) {
    const result = await client.query(
        `SELECT id, email, hashed_password, salt, iterations, memory, threads, updated_at, created_at FROM users WHERE id = $1`,
        [id],
    );

    if (result.rows.length === 0) {
        return null;
    }

    return <User>{
        id: result.rows[0].id,
        email: result.rows[0].email,
        hashed_password: result.rows[0].hashed_password,
        salt: result.rows[0].salt,
        iterations: result.rows[0].iterations,
        memory: result.rows[0].memory,
        threads: result.rows[0].threads,
        updated_at: result.rows[0].updated_at,
        created_at: result.rows[0].created_at,
    };
}
