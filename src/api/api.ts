import Elysia from "elysia";
import serverInfo from "./server-info";
import user from "./user";

export default new Elysia({ prefix: "/api" })
    .use(serverInfo)
    .use(user);
