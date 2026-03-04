import Fastify from "fastify";
import dbConnector from "./dbconnector";

const fastify = Fastify({ logger: true });

fastify.register(dbConnector);

fastify.listen({ port: 3000 }, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }

  fastify.log.info(`server listening on ${address}`);
});
