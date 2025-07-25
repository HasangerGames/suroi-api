import { t } from "elysia";
import { GameMode, Region, TeamMode } from "../generated/stats-db-client";

export type SortableStat<T> = {
    gameModes: {
        [key in Lowercase<GameMode>]: T;
    } & { unknown: T };
    teamModes: {
        [key in Lowercase<TeamMode>]: T;
    } & { unknown: T };
};

export const userBasicStatKeys = [
    // wins all time
    "wins",
    // games all time
    "games",
    // kills all time
    "kills",
    // revives all time
    "revives",
    // assists all time
    "assists",
    // damage all time
    "damage",
    // damage taken all time
    "damageTaken",
    // survived time in seconds, all time
    "timeSurvived",
    // max damage one game
    "maxDamage",
    // max kills one game
    "maxKills",
    // max survival time one game in seconds
    "maxSurvived",
] as const;
export type UserBasicStats = SortableStat<
    Record<(typeof userBasicStatKeys)[number], number>
>;

export const TUserStatBody = t.Object({
    user_id: t.String(),
});

export const TMatchBody = t.Object({
    region: t.Enum(Region),
    mode_id: t.Enum(GameMode),
    team_mode: t.Enum(TeamMode),
    start_time: t.Number(),
    end_time: t.Number(),
});

export const TMatchPlayersBody = t.Object({
    match_id: t.String(),
    players: t.Array(
        t.Object({
            user_id: t.String(),
            shots: t.Number(),
            hits: t.Number(),
            damage_taken: t.Number(),
            won: t.Boolean(),
            time_survived__s: t.Number(),
        })
    ),
});

export const TKillsBody = t.Object({
    match_id: t.String(),
    kills: t.Array(
        t.Object({
            weapon: t.String(),
            timestamp: t.Number(),
            killer_id: t.String(),
            killer_count: t.Number(),
            killed_id: t.String(),
            killed_count: t.Number(),
        })
    ),
});

export const TRevivesBody = t.Object({
    match_id: t.String(),
    revives: t.Array(
        t.Object({
            timestamp: t.Number(),
            reviver_id: t.String(),
            reviver_count: t.Number(),
            revived_id: t.String(),
            revived_count: t.Number(),
        })
    ),
});

export const TAssistsBody = t.Object({
    match_id: t.String(),
    assists: t.Array(
        t.Object({
            assister_id: t.String(),
            assister_count: t.Number(),
            killed_id: t.String(),
            killed_count: t.Number(),
        })
    ),
});

export const TDamagesBody = t.Object({
    match_id: t.String(),
    damages: t.Array(
        t.Object({
            user_id: t.String(),
            count: t.Number(),
            amount: t.Number(),
            weapon: t.String(),
        })
    ),
});
