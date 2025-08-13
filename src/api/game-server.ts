import { Elysia, t } from "elysia";
import Config from "../../config.json";
import { UserDBService } from "../db/user-db-service";
import type { ConfigSchema } from "../types/config";
import { TUserIdsBody } from "../types/stats";
import getStats from "./stats/get-stats";
import setStats from "./stats/set-stats";

const { trustedServerIPs } = Config as ConfigSchema;

export default new Elysia({
    prefix: "/server",
})
    .derive(({ request, server, status }) => {
        const ip = server?.requestIP(request)?.address;
        if (!ip) {
            return status(400);
        }
        return { ip };
    })
    .guard({
        headers: t.Object({
            Token: t.String(),
        }),
    })
    .resolve(({ headers: { Token }, ip, status }) => {
        if (
            !trustedServerIPs.includes(ip) ||
            Token !== process.env.GAME_SERVER_AUTH_TOKEN
        ) {
            return status(401);
        }
    })
    .get("/temp_user_id", async ({ ip }) => {
        return (await UserDBService.createTempUser(ip)).id;
    })
    .post(
        // Get user IDs for all of the sessions in this game.
        "/get_id",
        async ({ body: { session_token }, status }) => {
            const user = await UserDBService.getUserFromSession(session_token);
            return user?.id ?? status(404);
        },
        { body: TUserIdsBody }
    )
    .use(setStats)
    .use(getStats);
