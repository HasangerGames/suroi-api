import { Elysia, t } from "elysia";
import Config from "../../../config.json";
import type { ConfigSchema } from "../../types/config";
import getStats from "./get-stats";

const { trustedServerIPs } = Config as ConfigSchema;

export default new Elysia({
    prefix: "/stats",
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
    .use(getStats);
