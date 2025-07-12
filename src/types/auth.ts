import { t } from "elysia";
import Config from "../../config.json";
import type { ConfigSchema } from "./config";

const { maxNameLen } = Config as ConfigSchema;

export type AuthResult = {
    success: boolean;
    token?: string;
    expires?: Date;
    reason?: unknown;
};

export type AuthParams = {
    username: string;
    trusted: boolean;
    ip: string;
} & (
    | {
          w: string;
          sh: string[];
          ih: string[];
      }
    | { password: string }
);

export type AuthResponse = {
    success: boolean;
    st?: string;
    rp?: string;
};

export type RegistrationParams = {
    username: string;
    email: string;
    ip: string;
} & (
    | {
          w: string;
          sh: string[];
          ih: string[];
      }
    | { password: string }
);

export type RegistrationResponse = {
    success: boolean;
    st?: string;
    rp?: string;
};

export type SaltResponse = {
    salt: string;
};

export const TSessionCookie = t.Cookie(
    {
        session_token: t.String(),
    },
    {
        error: "Session token is missing or invalid.",
    }
);

export const TRegisterBody = t.Intersect([
    t.Object({
        username: t.String(),
        email: t.String(),
    }),
    t.Union([
        t.Object({
            password: t.String(),
        }),
        t.Object({
            w: t.String(),
            sh: t.Array(t.String()),
            ih: t.Array(t.String()),
        }),
    ]),
]);

export const TLoginBody = t.Intersect([
    t.Object({
        username: t.String(),
        trusted: t.Boolean(),
    }),
    t.Union([
        t.Object({
            password: t.String(),
        }),
        t.Object({
            w: t.String(),
            sh: t.Array(t.String()),
            ih: t.Array(t.String()),
        }),
    ]),
]);

export const TRenewTokenQuery = t.Object({ trusted: t.Optional(t.Boolean()) });
