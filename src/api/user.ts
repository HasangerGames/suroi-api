import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { AuthService } from "../auth/auth-service";
import { UserDBService } from "../db/user-db-service";
import {
    TLoginBody,
    TRegisterBody,
    TRenewTokenQuery,
    TSessionCookie,
} from "../types/auth";
import {
    TDeleteUserBody,
    TUpdateEmailBody,
    TUpdateNameBody,
} from "../types/user";
import getStats from "./stats/get-stats";
import Config from "../../config.json";
import type { ConfigSchema } from "../../../types/config";
const { corsOrigin } = Config as ConfigSchema;

let corsconfig = cors({
    origin: corsOrigin
});

export default new Elysia({
    prefix: "/user",
    cookie: {
        secrets: process.env.COOKIE_SECRET,
        sign: ["session_token"],
        path: "/",
    },
})
    .use(corsconfig)
    .derive(({ request, server, status }) => {
        const ip = server?.requestIP(request)?.address;
        if (!ip) {
            return status(400);
        }
        return { ip };
    })
    .get(
        "/register/saltshaker",
        async ({ body, cookie: { session_token }, ip, status }) => {
            return await AuthService.getSalt();
        }
    )
    .post(
        "/register",
        async ({ body, cookie: { session_token }, ip, status }) => {
            const auth = await AuthService.register({ ...body, ip });
            if (!auth.success) {
                return status(500, auth.reason);
            }

            session_token?.set({
                value: auth.token,
                expires: auth.expires,
            });
        },
        {
            body: TRegisterBody,
        }
    )
    .post(
        "/login",
        async ({ body, cookie: { session_token }, ip, status }) => {
            const auth = await AuthService.authenticate({ ...body, ip });
            if (!auth.success) {
                return status(401, auth.reason);
            }

            session_token?.set({
                value: auth.token,
                expires: auth.expires,
            });
        },
        {
            body: TLoginBody,
        }
    )
    .guard({ cookie: TSessionCookie })
    // Authorize client and get IP.
    .resolve(async ({ cookie: { session_token }, ip, status }) => {
        const isAuthorized = await AuthService.sessionValid(
            session_token.value,
            ip
        );
        if (!isAuthorized) {
            return status(401);
        }

        return { ip };
    })
    .get("/logout", async ({ cookie: { session_token } }) => {
        AuthService.invalidateSession(session_token.value);
        session_token.remove();
    })
    .get(
        "/renew_token",
        async ({ cookie: { session_token }, query: { trusted }, status }) => {
            const auth = await AuthService.renewToken(
                session_token.value,
                trusted
            );
            if (!auth.success) {
                return status(400, "Error renewing token.");
            }

            const { token, expires } = auth;
            session_token.value = token!;
            session_token.expires = expires!;
        },
        {
            query: TRenewTokenQuery,
        }
    )
    .put(
        "/update_name",
        async ({ body, cookie: { session_token }, status }) => {
            const user = await UserDBService.getUserFromSession(
                session_token.value
            );
            if (user === null) {
                return status(400, "Invalid session or user.");
            }

            try {
                UserDBService.updateUsername(user.id, body);
            } catch (e) {
                return status(400, "User does not exist.");
            }
        },
        {
            body: TUpdateNameBody,
        }
    )
    .put(
        "/update_email",
        async ({ body, cookie: { session_token }, status }) => {
            const user = await UserDBService.getUserFromSession(
                session_token.value
            );
            if (user === null) {
                return status(400, "Invalid session or user.");
            }

            try {
                UserDBService.updateEmail(user.id, body);
            } catch (e) {
                return status(400, "User does not exist.");
            }
        },
        {
            body: TUpdateEmailBody,
        }
    )
    .delete(
        "/",
        async ({ body, cookie: { session_token }, ip, status }) => {
            const res = await AuthService.deleteUser({
                ...body,
                ip,
                trusted: false,
            });
            if (!res.success) {
                return status(401);
            }

            session_token.remove();
        },
        { body: TDeleteUserBody }
    )
    .use(getStats);
