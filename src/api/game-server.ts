import { Elysia, t } from "elysia";
import Config from "../../config.json";
import { UserDBService } from "../db/user-db-service";
import type { ConfigSchema } from "../types/config";
import { TUserIdsBody } from "../types/stats";
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
            token: t.String(),
        }),
    })
    .resolve(({ headers: { token }, ip, status }) => {
        if (
            !trustedServerIPs.includes(ip) ||
            token !== process.env.GAME_SERVER_AUTH_TOKEN
        ) {
            return status(401);
        }
    })
    .post(
        // Get user IDs for all of the sessions in this game.
        "/user_ids",
        async ({ body }) => {
            const userIds: Record<string, string> = {};
            for (const token of body.session_tokens) {
                const user = await UserDBService.getUserFromSession(token);
                if (user) {
                    userIds[token] = user.id;
                }
            }
            return userIds;
        },
        { body: TUserIdsBody }
    )
    .use(setStats);
