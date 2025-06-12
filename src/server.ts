import Config from "../config.json";
import type { ConfigSchema } from "./config";

const { hostname, port } = Config as ConfigSchema;

Bun.serve({
    hostname,
    port,
    routes: {
        "/api/user/login":
    }
});
