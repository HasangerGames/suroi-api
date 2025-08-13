import { Elysia } from "elysia";
import { StatDBService } from "../../db/stats-db-service";
import {
    TAssistsBody,
    TDamagesBody,
    TKillsBody,
    TMatchBody,
    TMatchPlayersBody,
    TRevivesBody,
    TUserStatBody,
} from "../../types/stats";

export default new Elysia({
    prefix: "/stats",
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
            return (
                await StatDBService.createMatch(
                    region,
                    mode_id,
                    team_mode,
                    new Date(start_time),
                    new Date(end_time)
                )
            ).match_id;
        },
        { body: TMatchBody }
    )
    .post(
        "/match_players",
        async ({ body }) => {
            for (const {
                user_id,
                shots,
                hits,
                damage_taken,
                won,
                time_survived__s,
            } of body.players) {
                try {
                    StatDBService.createMatchPlayer(
                        body.match_id,
                        user_id,
                        shots,
                        hits,
                        damage_taken,
                        won,
                        time_survived__s
                    );
                } catch (e) {
                    console.warn(
                        `Could not create match player with ID ${user_id} in ` +
                        `match with ID ${body.match_id}.`
                    );
                    throw e;
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
                    throw e;
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
                    throw e;
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
                    throw e;
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
            for (const { user_id, count, amount, weapon } of body.damage) {
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
                    throw e;
                }
            }
        },
        {
            body: TDamagesBody,
        }
    );
