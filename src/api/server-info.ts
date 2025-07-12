import Elysia from "elysia";

interface ServerInfo {}

const serverInfo: Record<string, ServerInfo> = {};

export default new Elysia().get("/server_info", serverInfo);
