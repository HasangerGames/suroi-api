import * as Stats from "../generated/stats-db-client";
import * as Users from "../generated/users-db-client";

["exit", "SIGINT", "SIGUSR1", "SIGUSR2", "uncaughtException"].forEach(e => {
    process.on(e, () => {
        DBService.$closeConnections();
    });
});

export class DBService {
    private static _statsClient: Stats.PrismaClient = new Stats.PrismaClient();
    private static _usersClient: Users.PrismaClient = new Users.PrismaClient();

    // Create

    public static async createTempUser(ip: string): Promise<Users.CoreUser> {
        return await DBService._usersClient.coreUser.create({
            data: {
                ip_addrs: [ip],
            },
        });
    }

    public static async createUser(
        username: string,
        email: string,
        ip: string,
        last_auth_method: Users.AuthenticationMethod,
        hash_or_rp: string,
        salt?: string,
        session_nonce?: string,
        role: Users.Role = Users.Role.PLAYER
    ): Promise<Users.User> {
        return await DBService._usersClient.user.create({
            data: {
                username,
                role,
                email,
                last_auth_method,
                salt,
                session_nonce,
                hash_or_rp,
                core: {
                    create: { ip_addrs: [ip] },
                },
            },
        });
    }

    public static async createSession(
        user_id: string,
        session_token: string,
        trusted: boolean,
        expires: Date
    ): Promise<Users.Session> {
        return await DBService._usersClient.session.create({
            data: {
                user: {
                    connect: {
                        id: user_id,
                    },
                },
                token_hash: Bun.CryptoHasher.hash(
                    "sha384",
                    session_token
                ).toString(),
                trusted,
                expires,
            },
        });
    }

    public static async createPunishment(
        user_id: string,
        type: Users.PunishmentType,
        message: string,
        issuer_id: string,
        expires?: Date
    ): Promise<Users.Punishment> {
        return await DBService._usersClient.punishment.create({
            data: {
                type,
                message,
                expires: expires ?? null,
                user: {
                    connect: {
                        id: user_id,
                    },
                },
                issuer: {
                    connect: {
                        id: issuer_id,
                    },
                },
            },
        });
    }

    // Read

    public static async userExists(username: string): Promise<boolean> {
        return DBService.getIDFromName(username) !== null;
    }

    public static async getIDFromName(
        username: string
    ): Promise<string | null> {
        return await DBService._usersClient.user
            .findUnique({
                where: { username },
            })
            .then(user => user?.id ?? null);
    }

    public static async getIDFromSession(
        session_token: string
    ): Promise<string | null> {
        return (
            (
                await DBService._usersClient.session.findUnique({
                    where: {
                        token_hash: Bun.CryptoHasher.hash(
                            "sha384",
                            session_token
                        ).toString(),
                    },
                    select: {
                        user: {
                            select: {
                                id: true,
                            },
                        },
                    },
                })
            )?.user.id ?? null
        );
    }

    public static async getUserByName(
        username: string
    ): Promise<Users.User | null> {
        return await DBService._usersClient.user.findUnique({
            where: { username },
        });
    }

    public static async getUserByID(
        user_id: string
    ): Promise<Users.User | null> {
        return await DBService._usersClient.user.findUnique({
            where: {
                id: user_id,
            },
        });
    }

    public static async sessionValid(
        session_token: string,
        ip: string
    ): Promise<boolean> {
        const token_hash = Bun.CryptoHasher.hash(
            "sha384",
            session_token
        ).toString();
        const session = await DBService._usersClient.session.findUnique({
            where: {
                token_hash,
                expires: { gt: new Date() },
            },
            select: {
                user: {
                    select: {
                        core: {
                            select: {
                                ip_addrs: true,
                            },
                        },
                    },
                },
            },
        });
        return session !== null && session.user.core.ip_addrs.includes(ip);
    }

    public static async getActiveSessionTokens(
        user_id: string
    ): Promise<string[]> {
        const NOW = new Date();
        return await DBService._usersClient.session
            .findMany({
                select: {
                    token_hash: true,
                },
                where: {
                    user_id,
                    expires: {
                        gt: NOW,
                    },
                    created: {
                        lte: NOW,
                    },
                },
            })
            .then(sessions => sessions.map(session => session.token_hash));
    }

    public static async getAllSessionTokens(
        user_id: string
    ): Promise<Users.Session[]> {
        return await DBService._usersClient.session.findMany({
            where: { user_id },
        });
    }

    public static async getActivePunishments(
        user_id: string
    ): Promise<Users.Punishment[]> {
        const NOW = new Date();
        return await DBService._usersClient.punishment.findMany({
            where: {
                user_id,
                OR: [
                    { expires: null },
                    {
                        expires: { gt: NOW },
                        issued: { lte: NOW },
                    },
                ],
            },
        });
    }

    public static async getAllPunishments(
        user_id: string
    ): Promise<Users.Punishment[]> {
        return await DBService._usersClient.punishment.findMany({
            where: { user_id },
        });
    }

    // Update

    public static async updateIPs(
        user_id: string,
        ip: string
    ): Promise<Users.CoreUser> {
        return await DBService._usersClient.coreUser.update({
            where: { id: user_id },
            data: { ip_addrs: { push: ip } },
        });
    }

    public static async updateUsername(
        user_id: string,
        new_username: string
    ): Promise<Users.User> {
        return await DBService._usersClient.user.update({
            where: { id: user_id },
            data: { username: new_username },
        });
    }

    public static async updateLastActive(user_id: string): Promise<Users.User> {
        return await DBService._usersClient.user.update({
            where: { id: user_id },
            data: { last_active: new Date() },
        });
    }

    public static async updateAuthInfo(
        user_id: string,
        hash_or_rp: string,
        session_nonce?: string,
        salt?: string
    ): Promise<Users.User> {
        return await DBService._usersClient.user.update({
            where: { id: user_id },
            data: {
                salt,
                session_nonce,
                hash_or_rp,
            },
        });
    }

    public static async updateMFA(
        user_id: string,
        totp_enabled: boolean,
        totp_secret: string
    ): Promise<Users.User> {
        return await DBService._usersClient.user.update({
            where: { id: user_id },
            data: {
                totp_enabled,
                totp_secret,
            },
        });
    }

    public static async updateEmail(
        user_id: string,
        new_email: string
    ): Promise<Users.User> {
        return await DBService._usersClient.user.update({
            where: { id: user_id },
            data: { email: new_email },
        });
    }

    public static async updateRole(
        user_id: string,
        new_role: Users.Role
    ): Promise<Users.User> {
        return await DBService._usersClient.user.update({
            where: { id: user_id },
            data: { role: new_role },
        });
    }

    // Delete

    /*
     * Clears all old session tokens by default, or a particular user's if an ID specified.
     * Returns the number of deleted records.
     */
    public static async clearOldSessions(user_id?: string): Promise<number> {
        return await DBService._usersClient.session
            .deleteMany({
                where: {
                    expires: {
                        lte: new Date(),
                    },
                    ...(user_id !== undefined ? { user_id: user_id } : {}),
                },
            })
            .then(batch => batch.count);
    }

    public static async clearUserSessions(user_id: string): Promise<number> {
        return await DBService._usersClient.session
            .deleteMany({
                where: { user_id },
            })
            .then(batch => batch.count);
    }

    public static async clearOldPunishments(user_id?: string): Promise<number> {
        return await DBService._usersClient.punishment
            .deleteMany({
                where: {
                    expires: {
                        lte: new Date(),
                    },
                    ...(user_id !== undefined ? { user_id: user_id } : {}),
                },
            })
            .then(batch => batch.count);
    }

    public static async clearUserPunishments(user_id: string): Promise<number> {
        return await DBService._usersClient.punishment
            .deleteMany({
                where: { user_id },
            })
            .then(batch => batch.count);
    }

    // Returns the user if it existed, null otherwise.
    public static async deleteUser(
        user_id: string
    ): Promise<Users.User | null> {
        const user: Users.User | null =
            await DBService._usersClient.user.findUnique({
                where: { id: user_id },
                include: {
                    core: {
                        include: { punishments: true },
                    },
                },
            });
        if (!user) {
            return null;
        }
        await DBService.clearUserSessions(user_id);
        await DBService.clearUserPunishments(user_id);
        await DBService._usersClient.user.delete({ where: { id: user_id } });
        await DBService._usersClient.coreUser.delete({
            where: { id: user_id },
        });
        return user;
    }

    public static async deleteSession(
        session_token: string
    ): Promise<Users.Session | null> {
        try {
            return await DBService._usersClient.session.delete({
                where: {
                    token_hash: Bun.CryptoHasher.hash(
                        "sha384",
                        session_token
                    ).toString(),
                },
            });
        } catch (e) {
            // Record not found.
            return null;
        }
    }

    public static $closeConnections() {
        DBService._statsClient.$disconnect();
        DBService._usersClient.$disconnect();
    }
}

export * as Stats from "../generated/stats-db-client";
export * as Users from "../generated/users-db-client";
