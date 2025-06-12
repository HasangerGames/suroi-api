import Elysia from "elysia";
import serverInfo from "./serverInfo";
import user from "./user";

export default new Elysia({ prefix: "/api" })
    .use(serverInfo)
    .use(user);
