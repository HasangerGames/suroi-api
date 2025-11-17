import Elysia from "elysia";
import Config from "../config.json";
import api from "./api/api";
import type { ConfigSchema } from "./types/config";
import { AuthService } from "./auth/auth-service";

const { hostname, port } = Config as ConfigSchema;

if (!process.env["USERS_DB_URL"] || !process.env["STATS_DB_URL"]) {
    console.error("FATAL: Environmental variables USERS_DB_URL and STATS_DB_URL are not set, but required for the server to function");
}

else {
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
            if (Config.authenticationMethod == "meow"){
                AuthService.initMeow();
            }
        });
}

console.log("Server terminated");