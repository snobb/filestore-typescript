import { FastifyReply, FastifyRequest } from 'fastify';
import { Pool } from 'pg';
import { Service as UserService } from './user.service';
import { generateToken } from '../auth';

export interface RegisterRequest {
    email: string;
    password: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface AuthResponse {
    user_id: string;
    email: string;
}

function getPool(request: FastifyRequest): Pool {
    return request.server.pg as unknown as Pool;
}

function sendError(reply: FastifyReply, statusCode: number, error: string) {
    reply.code(statusCode).send({ error });
}

function setAuthCookie(reply: FastifyReply, token: string) {
    reply.setCookie('token', token, {
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
    });
}

export async function registerHandler(
    request: FastifyRequest<{ Body: RegisterRequest }>,
    reply: FastifyReply,
) {
    const { email, password } = request.body;

    if (!email || !password) {
        return sendError(reply, 400, 'email and password are required');
    }

    if (password.length < 8) {
        return sendError(reply, 400, 'password must be at least 8 characters');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return sendError(reply, 400, 'invalid email format');
    }

    try {
        const pg = getPool(request);
        const service = new UserService(pg);
        const user = await service.create(email, password);

        const token = generateToken(request.server, user.id, user.email);
        setAuthCookie(reply, token);

        const response: AuthResponse = {
            user_id: user.id,
            email: user.email,
        };

        reply.code(201).send(response);
    } catch (err) {
        request.server.log.error(err);
        return sendError(reply, 500, 'unable to create user');
    }
}

export async function loginHandler(
    request: FastifyRequest<{ Body: LoginRequest }>,
    reply: FastifyReply,
) {
    const { email, password } = request.body;

    if (!email || !password) {
        return sendError(reply, 400, 'email and password are required');
    }

    try {
        const pg = getPool(request);
        const service = new UserService(pg);
        const user = await service.verifyLogin(email, password);

        if (!user) {
            return sendError(reply, 401, 'invalid credentials');
        }

        const token = generateToken(request.server, user.id, user.email);
        setAuthCookie(reply, token);

        const response: AuthResponse = {
            user_id: user.id,
            email: user.email,
        };

        reply.code(200).send(response);
    } catch (err) {
        request.server.log.error(err);
        return sendError(reply, 500, 'unable to authenticate');
    }
}
