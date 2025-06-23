import { DBService } from "../db/db-service";
import { Role } from "../generated/users-db-client";
import crypto from "crypto";

export class AuthService {
    // default token lifetime in seconds
    public static readonly DEFAULT_TOKEN_LIFETIME: number = 7200;
    // token lifetime for "trusted computers"
    public static readonly TRUSTED_TOKEN_LIFETIME: number = 86400 * 7;

    public static async sessionValid(session_token: string, ip?: string): Promise<boolean> {
        return ip !== undefined && DBService.sessionValid(session_token, ip);
    }

    // IMPORTANT - this assumes the session given is valid.
    public static async invalidateSession(session_token: string): Promise<void> {
        DBService.deleteSession(session_token);
    }

    // IMPORTANT - this assumes the session given is valid.
    public static async renewToken(session_token: string, trusted?: boolean): Promise<AuthResult> {
        try {
            const session = (await DBService.deleteSession(session_token))!;
            const { token, expires } = await this.generateSession(session.user_id, trusted ?? session.trusted);
            return { success: true, token, expires };
        } catch (e) {
            return { success: false, reason: e };
        }
    }

    // Returns a boolean indicating success.
    public static async register(
        username: string, email: string,
        w: string, sh: string[],
        ih: string[], ip: string): Promise<AuthResult> {
        let saltRes;
        try {
            saltRes = await this.getSalt();
        } catch (e) {
            return { success: false, reason: e };
        }

        const params: RegistrationParams = { w, s_salt: saltRes.salt, sh, ih };
        const res: RegistrationResponse = await fetch(process.env.AUTH_SERVER_URL! + "/register", {
            method: "POST",
            body: JSON.stringify(params)
        }).then(res => res.json()) as RegistrationResponse;
        if (!res.success) {
            return { success: false, reason: "Rejected by authentication server." };
        }

        try {
            const user_id = (await DBService.createUser(username, email, saltRes.salt, res.st!, res.rp!, ip)).id;
            const { token, expires } = await this.generateSession(user_id, false);
            return { success: true, token, expires };
        } catch (e) {
            return { success: false, reason: e };
        }
    }

    public static async authenticate(
        user_id: string, trusted: boolean,
        w: string, sh: string[],
        ih: string[]): Promise<AuthResult> {
        const user = await DBService.getUserByID(user_id);
        if (!user) {
            return {
                success: false,
                reason: "Could not find user in database."
            };
        }

        const params: AuthParams = {
            s_rp: user.root_proof,
            s_st: user.session_nonce,
            s_salt: user.salt,
            w,
            sh,
            ih
        };
        const res: AuthResponse = await fetch(process.env.AUTH_SERVER_URL! + "/authenticate", {
            method: "POST",
            body: JSON.stringify(params)
        }).then(res => res.json()) as AuthResponse;
        if (!res.success) {
            return {
                success: false,
                reason: "Could not authenticate"
            };
        }

        try {
            await DBService.updateAuthInfo(user_id, res.st!, res.rp!);
            const { token, expires } = await this.generateSession(user_id, trusted);
            return { success: true, token, expires };
        } catch (e: unknown) {
            return {
                success: false,
                reason: e
            };
        }
    }

    private static generateSessionID() {
        return crypto.randomUUID();
    }

    private static async getSalt(): Promise<SaltResponse> {
        return await fetch(process.env.AUTH_SERVER_URL! + "/salt").then(res => {
            if (!res.ok) {
                throw new Error("Failed to get salt.");
            }
            return res.json();
        }) as SaltResponse;
    }

    private static async generateSession(user_id: string, trusted: boolean): Promise<{ token: string, expires: Date }> {
        const token = this.generateSessionID();
        const expires = new Date(Date.now() + (trusted ? this.TRUSTED_TOKEN_LIFETIME : this.DEFAULT_TOKEN_LIFETIME));
        // Default to untrusted.
        await DBService.createSession(user_id, token, trusted, expires);
        return { token, expires };
    }
}

export type AuthResult = {
    success: boolean;
    token?: string;
    expires?: Date;
    reason?: unknown;
};

export type AuthParams = {
    s_rp: string;
    s_st: string;
    s_salt: string;
    w: string;
    sh: string[];
    ih: string[];
};

export type AuthResponse = {
    success: boolean;
    st?: string;
    rp?: string;
};

export type RegistrationParams = {
    w: string;
    s_salt: string;
    sh: string[];
    ih: string[];
};

export type RegistrationResponse = {
    success: boolean;
    st?: string;
    rp?: string;
};

export type SaltResponse = {
    salt: string;
};
