import Elysia from "elysia";
import Config from "../config.json";
import api from "./api/api";
import type { ConfigSchema } from "./types/config";

const { hostname, port } = Config as ConfigSchema;

new Elysia({
    serve: {
        hostname,
        ...(process.env.USE_TLS
            ? {
                  tls: {
                      cert: Bun.file(process.env.CERT_PATH!),
                      key: Bun.file(process.env.KEY_PATH!),
                  },
              }
            : {}),
    },
})
    .use(api)
    .listen(port, () => {
        console.log(`Listening on port ${port}`);
    });
