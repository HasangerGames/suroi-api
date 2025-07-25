import Elysia from "elysia";
import admin from "./admin";
import serverInfo from "./server-info";
import setStats from "./stats/set-stats";
import user from "./user";

export default new Elysia({ prefix: "/api" })
    .onError(async ({ code, set, error }) => {
        if (code === "VALIDATION") {
            set.status = 400;
            return error.message;
        }
    })
    .use(serverInfo)
    .use(user)
    .use(admin)
    .use(setStats);
