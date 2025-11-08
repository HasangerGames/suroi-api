import { t } from "elysia";

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

export const TRegisterBody = t.Object({
    username: t.String(),
    email: t.String(),
    salt: t.String(),
    w: t.String(),
    sh: t.Array(t.String()),
    ih: t.Array(t.String())
});

// this assertion seems to have an issue and rejects a valid one as well even
// when i spam additionalProperties
/*t.Intersect([
    t.Object({
        username: t.String(),
        email: t.String(),
    }, {additionalProperties: true}),
    t.Union([
        t.Object({
            password: t.String(),
        }, {additionalProperties: true}),
        t.Object({
            w: t.String(),
            sh: t.Array(t.String()),
            ih: t.Array(t.String()),
        }, {additionalProperties: true}),
    ], {additionalProperties: true}),
]);*/

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
