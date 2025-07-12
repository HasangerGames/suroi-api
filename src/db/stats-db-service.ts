import * as Stats from "../generated/stats-db-client";
import { UserDBService } from "./user-db-service";

["exit", "SIGINT", "SIGUSR1", "SIGUSR2", "uncaughtException"].forEach(e => {
    process.on(e, () => {
        StatDBService.$closeConnections();
    });
});

export class StatDBService {
    static #client: Stats.PrismaClient = new Stats.PrismaClient();

    // Create

    public static async createUserStat(
        user_id: string
    ): Promise<Stats.UserStat> {
        if (UserDBService.getUserByID(user_id) === null) {
            throw new ReferenceError("User does not exist in users database.");
        }
        return await this.#client.userStat.create({
            data: {
                user_id,
            },
        });
    }

    public static async createMatch(
        region: Stats.Region,
        mode_id: Stats.GameMode,
        team_mode: Stats.TeamMode,
        start_time: Date,
        end_time: Date
    ): Promise<Stats.Match> {
        return await this.#client.match.create({
            data: {
                region,
                mode_id,
                team_mode,
                start_time,
                end_time,
            },
        });
    }

    public static async createMatchPlayer(
        match_id: string,
        user_id: string,
        shots: number,
        hits: number,
        won: boolean,
        time_survived__s: number
    ): Promise<Stats.MatchPlayer> {
        return await this.#client.matchPlayer.create({
            data: {
                match: {
                    connect: {
                        match_id,
                    },
                },
                user: {
                    connect: {
                        user_id,
                    },
                },
                shots,
                hits,
                won,
                time_survived__s,
            },
        });
    }

    public static async createKill(
        weapon: string,
        timestamp: Date,
        match_id: string,
        killer_id: string,
        killer_count: number,
        killed_id: string,
        killed_count: number
    ): Promise<Stats.Kill> {
        return await this.#client.kill.create({
            data: {
                weapon,
                timestamp,
                killer: {
                    connect: {
                        match_id_user_id_count: {
                            match_id,
                            user_id: killer_id,
                            count: killer_count,
                        },
                    },
                },
                killed: {
                    connect: {
                        match_id_user_id_count: {
                            match_id,
                            user_id: killed_id,
                            count: killed_count,
                        },
                    },
                },
            },
        });
    }

    public static async createRevive(
        timestamp: Date,
        match_id: string,
        reviver_id: string,
        reviver_count: number,
        revived_id: string,
        revived_count: number
    ): Promise<Stats.Revive> {
        return await this.#client.revive.create({
            data: {
                timestamp,
                reviver: {
                    connect: {
                        match_id_user_id_count: {
                            match_id,
                            user_id: reviver_id,
                            count: reviver_count,
                        },
                    },
                },
                revived: {
                    connect: {
                        match_id_user_id_count: {
                            match_id,
                            user_id: revived_id,
                            count: revived_count,
                        },
                    },
                },
            },
        });
    }

    public static async createAssist(
        match_id: string,
        assister_id: string,
        assister_count: number,
        killed_id: string,
        killed_count: number
    ): Promise<Stats.Assist> {
        return await this.#client.assist.create({
            data: {
                assister: {
                    connect: {
                        match_id_user_id_count: {
                            match_id,
                            user_id: assister_id,
                            count: assister_count,
                        },
                    },
                },
                kill: {
                    connect: {
                        match_id_killed_id_killed_count: {
                            match_id,
                            killed_id,
                            killed_count,
                        },
                    },
                },
            },
        });
    }

    public static async createDamage(
        match_id: string,
        user_id: string,
        count: number,
        amount: number,
        weapon: string
    ): Promise<Stats.Damage> {
        return await this.#client.damage.create({
            data: {
                match_player: {
                    connect: {
                        match_id_user_id_count: {
                            match_id,
                            user_id,
                            count,
                        },
                    },
                },
                amount,
                weapon,
            },
        });
    }

    // Read

    public static async getUserMatches(
        user_id: string
    ): Promise<Stats.Match[] | null> {
        return await this.#client.userStat
            .findUnique({
                where: {
                    user_id,
                },
                include: {
                    matches: true,
                },
            })
            .matches();
    }

    public static async getUserMatchPlayers(
        user_id: string
    ): Promise<Stats.MatchPlayer[] | null> {
        return await this.#client.userStat
            .findUnique({
                where: {
                    user_id,
                },
                include: {
                    match_players: {
                        include: {
                            match: true,
                        },
                    },
                },
            })
            .match_players();
    }

    public static async getUserKills(
        user_id: string
    ): Promise<Stats.Kill[] | null> {
        return await this.#client.kill.findMany({
            where: {
                killer_id: user_id,
            },
            include: {
                assist: true,
            },
        });
    }

    public static async getUserRevives(
        user_id: string
    ): Promise<Stats.Revive[] | null> {
        return await this.#client.revive.findMany({
            where: {
                reviver_id: user_id,
            },
        });
    }

    public static async getUserAssists(
        user_id: string
    ): Promise<Stats.Assist[] | null> {
        return await this.#client.assist.findMany({
            where: {
                assister_id: user_id,
            },
            include: {
                kill: true,
            },
        });
    }

    public static async getUserDamage(
        user_id: string
    ): Promise<Stats.Damage[] | null> {
        return await this.#client.damage.findMany({
            where: {
                user_id: user_id,
            },
        });
    }

    public static async getMatch(
        match_id: string
    ): Promise<Stats.Match | null> {
        return await this.#client.match.findUnique({ where: { match_id } });
    }

    // Update

    public static async addDamage(
        match_id: string,
        user_id: string,
        count: number,
        amount: number,
        weapon: string
    ): Promise<Stats.Damage> {
        return await this.#client.damage.update({
            where: {
                match_id_user_id_count_weapon: {
                    match_id,
                    user_id,
                    count,
                    weapon,
                },
            },
            data: {
                amount: {
                    increment: amount,
                },
            },
        });
    }

    public static async addFriend(
        user_id: string,
        new_friend_id: string
    ): Promise<Stats.UserStat> {
        return await this.#client.userStat.update({
            where: {
                user_id,
            },
            data: {
                friends: {
                    push: new_friend_id,
                },
            },
        });
    }

    // Delete

    public static async deleteUserStat(
        user_id: string
    ): Promise<Stats.UserStat | null> {
        try {
            return await this.#client.userStat.delete({
                where: {
                    user_id,
                },
            });
        } catch (e) {
            // Record not found.
            return null;
        }
    }

    public static async deleteMatch(
        match_id: string
    ): Promise<Stats.Match | null> {
        try {
            return await this.#client.match.delete({
                where: {
                    match_id,
                },
            });
        } catch (e) {
            // Record not found.
            return null;
        }
    }

    public static $closeConnections() {
        StatDBService.#client.$disconnect();
    }
}

export * as Stats from "../generated/stats-db-client";
