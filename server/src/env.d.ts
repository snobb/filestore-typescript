import 'fastify';
import '@fastify/jwt';
import { type FileStore } from './filestore/disk.ts';
import { Service as DocumentService } from './document.service.ts';

declare module 'fastify' {
    interface FastifyInstance {
        documentService: typeof DocumentService;
        fileStore: FileStore;
    }

    interface FastifyInstance {
        authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    }
}

declare module '@fastify/jwt' {
    interface FastifyInstance {
        fileStore: FileStore;
    }

    interface FastifyJWT {
        payload: { userId: string; email: string };
        user: { userId: string; email: string };
    }
}
