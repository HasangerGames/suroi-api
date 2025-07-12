import { Elysia, t } from "elysia";
import Config from "../../../config.json";
import { StatDBService } from "../../db/stats-db-service";
import type { ConfigSchema } from "../../types/config";
import {
    TAssistsBody,
    TDamagesBody,
    TKillsBody,
    TMatchBody,
    TMatchPlayersBody,
    TRevivesBody,
    TUserStatBody,
} from "../../types/stats";
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
    .post(
        "/user_stat",
        async ({ body }) => {
            await StatDBService.createUserStat(body.user_id);
        },
        { body: TUserStatBody }
    )
    .post(
        "/match",
        async ({
            body: { region, mode_id, team_mode, start_time, end_time },
        }) => {
            await StatDBService.createMatch(
                region,
                mode_id,
                team_mode,
                new Date(start_time),
                new Date(end_time)
            );
        },
        { body: TMatchBody }
    )
    .post(
        "/match_players",
        async ({ body }) => {
            for (const {
                user_id,
                hits,
                shots,
                won,
                time_survived__s,
            } of body.players) {
                try {
                    StatDBService.createMatchPlayer(
                        body.match_id,
                        user_id,
                        shots,
                        hits,
                        won,
                        time_survived__s
                    );
                } catch (e) {
                    console.warn(
                        `Could not create match player with ID ${user_id} in ` +
                            `match with ID ${body.match_id}.`
                    );
                }
            }
        },
        {
            body: TMatchPlayersBody,
        }
    )
    .post(
        "/match_kills",
        async ({ body }) => {
            for (const {
                weapon,
                timestamp,
                killer_id,
                killer_count,
                killed_id,
                killed_count,
            } of body.kills) {
                try {
                    StatDBService.createKill(
                        weapon,
                        new Date(timestamp),
                        body.match_id,
                        killer_id,
                        killer_count,
                        killed_id,
                        killed_count
                    );
                } catch (e) {
                    console.warn(
                        "Could not create kill for player with ID " +
                            `${killer_id} in match with ID ${body.match_id}.`
                    );
                }
            }
        },
        {
            body: TKillsBody,
        }
    )
    .post(
        "/match_revives",
        async ({ body }) => {
            for (const {
                timestamp,
                reviver_id,
                reviver_count,
                revived_id,
                revived_count,
            } of body.revives) {
                try {
                    StatDBService.createRevive(
                        new Date(timestamp),
                        body.match_id,
                        reviver_id,
                        reviver_count,
                        revived_id,
                        revived_count
                    );
                } catch (e) {
                    console.warn(
                        "Could not create revive for player with ID " +
                            `${reviver_id} in match with ID ${body.match_id}.`
                    );
                }
            }
        },
        {
            body: TRevivesBody,
        }
    )
    .post(
        "/match_assists",
        async ({ body }) => {
            for (const {
                assister_id,
                assister_count,
                killed_id,
                killed_count,
            } of body.assists) {
                try {
                    StatDBService.createAssist(
                        body.match_id,
                        assister_id,
                        assister_count,
                        killed_id,
                        killed_count
                    );
                } catch (e) {
                    console.warn(
                        "Could not create assist for player with ID " +
                            `${assister_id} in match with ID ${body.match_id}.`
                    );
                }
            }
        },
        {
            body: TAssistsBody,
        }
    )
    .post(
        "/match_damage",
        async ({ body }) => {
            for (const { user_id, count, amount, weapon } of body.damages) {
                try {
                    StatDBService.createDamage(
                        body.match_id,
                        user_id,
                        count,
                        amount,
                        weapon
                    );
                } catch (e) {
                    console.warn(
                        "Could not create damage for player with ID " +
                            `${user_id} in match with ID ${body.match_id}.`
                    );
                }
            }
        },
        {
            body: TDamagesBody,
        }
    )
    .use(getStats);
