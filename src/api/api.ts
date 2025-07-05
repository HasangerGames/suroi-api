import Elysia from "elysia";
import admin from "./admin";
import serverInfo from "./server-info";
import setStats from "./stats/set-stats";
import user from "./user";

export default new Elysia({ prefix: "/api" })
    .use(serverInfo)
    .use(user)
    .use(admin)
    .use(setStats);
