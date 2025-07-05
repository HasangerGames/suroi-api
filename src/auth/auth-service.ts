import crypto from "crypto";
import Config from "../../config.json";
import { UserDBService } from "../db/user-db-service";
import { AuthenticationMethod } from "../generated/users-db-client";
import type { ConfigSchema } from "../types/config";
import type {
    AuthParams,
    AuthResponse,
    AuthResult,
    RegistrationParams,
    RegistrationResponse,
    SaltResponse,
} from "./auth-types";

const { authenticationMethod, authServer } = Config as ConfigSchema;

export class AuthService {
    // default token lifetime in seconds
    public static readonly DEFAULT_TOKEN_LIFETIME: number = 7200 * 1000;
    // token lifetime for "trusted computers"
    public static readonly TRUSTED_TOKEN_LIFETIME: number = 86400 * 7 * 1000;

    public static async sessionValid(
        session_token: string,
        ip?: string
    ): Promise<boolean> {
        return (
            ip !== undefined && UserDBService.sessionValid(session_token, ip)
        );
    }

    // IMPORTANT - this assumes the session given is valid.
    public static async invalidateSession(
        session_token: string
    ): Promise<void> {
        UserDBService.deleteSession(session_token);
    }

    // IMPORTANT - this assumes the session given is valid.
    public static async renewToken(
        session_token: string,
        trusted?: boolean
    ): Promise<AuthResult> {
        try {
            const session = (await UserDBService.deleteSession(session_token))!;
            await UserDBService.updateLastActive(session.user_id);
            const { token, expires } = await this.generateSession(
                session.user_id,
                trusted ?? session.trusted ?? false
            );
            return { success: true, token, expires };
        } catch (e) {
            return { success: false, reason: "Error renewing token." };
        }
    }

    public static async register(
        params: RegistrationParams
    ): Promise<AuthResult> {
        if ("password" in params !== (authenticationMethod === "default")) {
            return { success: false, reason: "Wrong authentication method." };
        }

        const { username, email, ip } = params;
        let args: Parameters<typeof UserDBService.createUser>;

        if ("password" in params) {
            // Default authentication method - password hash.
            args = [
                username,
                email,
                ip,
                AuthenticationMethod.DEFAULT,
                await Bun.password.hash(params.password),
            ];
        } else {
            // 616 authentication method
            const { w, sh, ih } = params;
            let saltRes;
            try {
                saltRes = await this.getSalt();
            } catch (e) {
                return { success: false, reason: "Authentication error." };
            }

            const res: RegistrationResponse = (await fetch(
                authServer + "/register",
                {
                    method: "POST",
                    body: JSON.stringify({ w, s_salt: saltRes.salt, sh, ih }),
                }
            ).then(res => res.json())) as RegistrationResponse;
            if (!res.success) {
                return {
                    success: false,
                    reason: "Rejected by authentication server.",
                };
            }

            args = [
                username,
                email,
                ip,
                AuthenticationMethod.MEOW,
                res.rp!,
                saltRes.salt,
                res.st!,
            ];
        }

        try {
            const user_id = (await UserDBService.createUser(...args)).id;
            const { token, expires } = await this.generateSession(
                user_id,
                false
            );
            return { success: true, token, expires };
        } catch (e) {
            return {
                success: false,
                reason: "Error creating user; maybe a user with the same name exists already?",
            };
        }
    }

    public static async authenticate(params: AuthParams): Promise<AuthResult> {
        if ("password" in params !== (authenticationMethod === "default")) {
            return { success: false, reason: "Wrong authentication method." };
        }

        const { username, trusted, ip } = params;
        const user = await UserDBService.getUserByName(username);
        if (!user) {
            return {
                success: false,
                reason: `Could not find user with name ${username} in the database.`,
            };
        }

        if ("password" in params) {
            if (await Bun.password.verify(params.password, user.hash_or_rp)) {
                try {
                    await UserDBService.updateLastActive(user.id);
                    await UserDBService.updateIPs(user.id, ip);
                    const { token, expires } = await this.generateSession(
                        user.id,
                        trusted
                    );
                    return { success: true, token, expires };
                } catch (e) {
                    return {
                        success: false,
                        reason: "Error creating session.",
                    };
                }
            } else {
                return {
                    success: false,
                    reason: "Wrong password.",
                };
            }
        } else {
            const { w, sh, ih } = params;
            const res: AuthResponse = (await fetch(
                authServer + "/authenticate",
                {
                    method: "POST",
                    body: JSON.stringify({
                        s_rp: user.hash_or_rp,
                        s_st: user.session_nonce,
                        s_salt: user.salt,
                        w,
                        sh,
                        ih,
                    }),
                }
            ).then(res => res.json())) as AuthResponse;
            if (!res.success) {
                return {
                    success: false,
                    reason: "Could not authenticate.",
                };
            }

            try {
                await UserDBService.updateAuthInfo(
                    username,
                    res.rp!,
                    ip,
                    res.st!
                );
                await UserDBService.updateLastActive(user.id);
                const { token, expires } = await this.generateSession(
                    user.id,
                    trusted
                );
                return { success: true, token, expires };
            } catch (e) {
                return {
                    success: false,
                    reason: "Error creating session.",
                };
            }
        }
    }

    public static async deleteUser(params: AuthParams): Promise<AuthResult> {
        const auth = await this.authenticate(params);
        if (!auth.success) {
            return { success: false, reason: "Invalid credentials." };
        }

        try {
            const user_id = await UserDBService.getIDFromName(params.username);
            if (!user_id) {
                return {
                    success: false,
                    reason: `No user with name ${params.username}`,
                };
            }
            await UserDBService.deleteUser(user_id)!;
            return { success: true };
        } catch (e) {
            return { success: false, reason: "Database operation failed." };
        }
    }

    private static async getSalt(): Promise<SaltResponse> {
        return (await fetch(authServer + "/salt").then(res => {
            if (!res.ok) {
                throw new Error("Failed to get salt.");
            }
            return res.json();
        })) as SaltResponse;
    }

    private static async generateSession(
        user_id: string,
        trusted: boolean
    ): Promise<{ token: string; expires: Date }> {
        const token = crypto.randomUUID();
        const expires = new Date(
            Date.now() +
                (trusted
                    ? this.TRUSTED_TOKEN_LIFETIME
                    : this.DEFAULT_TOKEN_LIFETIME)
        );
        await UserDBService.createSession(user_id, token, trusted, expires);
        return { token, expires };
    }
}
