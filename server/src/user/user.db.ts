import { PoolClient } from 'pg';

export interface User {
    id: string;
    email: string;
    hashed_password: string;
    salt: string;
    iterations: number;
    created_at: string;
}

export async function create(
    client: PoolClient,
    email: string,
    passwordHash: string,
    salt: string,
    iterations: number,
) {
    const id = crypto.randomUUID();
    const username = email.split('@')[0];
    const result = await client.query(
        `INSERT INTO users (id, email, username, hashed_password, salt, iterations)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (email)
         DO UPDATE SET
             hashed_password = EXCLUDED.hashed_password,
             salt = EXCLUDED.salt,
             iterations = EXCLUDED.iterations
         RETURNING id, email, created_at`,
        [id, email, username, passwordHash, salt, iterations],
    );

    return <User>{
        id: result.rows[0].id,
        email: result.rows[0].email,
        created_at: result.rows[0].created_at,
    };
}

export async function getByEmail(client: PoolClient, email: string) {
    const result = await client.query(
        `SELECT id, email, hashed_password, salt, iterations, created_at FROM users WHERE email = $1`,
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
        created_at: result.rows[0].created_at,
    };
}

export async function getByID(client: PoolClient, id: string) {
    const result = await client.query(
        `SELECT id, email, hashed_password, salt, iterations, created_at FROM users WHERE id = $1`,
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
        created_at: result.rows[0].created_at,
    };
}
