import Elysia, { t } from "elysia";

interface ServerInfo {}

const serverInfo: Record<string, ServerInfo> = {};

export default new Elysia()
    .get("/serverInfo", serverInfo)
    .post("/serverInfo", ({ body }) => {}, {
        body: t.Object({}),
    });
