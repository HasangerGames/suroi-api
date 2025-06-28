import { Elysia } from "elysia";
import { AuthService } from "../auth/auth-service";
import {
    TDeleteUserBody,
    TLoginBody,
    TRegisterBody,
    TRenewTokenQuery,
    TSessionCookie,
    TUpdateEmailBody,
    TUpdateNameBody,
} from "../auth/auth-types";
import { DBService } from "../db/db-service";

export default new Elysia({
    prefix: "/user",
    cookie: {
        secrets: process.env.COOKIE_SECRET,
        sign: ["session_token"],
        path: "/",
    },
})
    .onError(async ({ code, set, error }) => {
        if (code === "VALIDATION") {
            set.status = 400;
            return error.message;
        }
    })
    .derive(({ request, server, status }) => {
        const ip = server?.requestIP(request)?.address;
        if (!ip) {
            return status(400);
        }
        return { ip };
    })
    .post(
        "/register",
        async ({ body, cookie: { session_token }, ip, status }) => {
            const auth = await AuthService.register({ ...body, ip });
            if (!auth.success) {
                return status(401, auth.reason);
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
        async ({ body, cookie: { session_token }, status }) => {
            const auth = await AuthService.authenticate(body);
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
        "/updateName",
        async ({ body, cookie: { session_token }, status }) => {
            const user_id = await DBService.getIDFromSession(
                session_token.value
            );
            if (user_id === null) {
                return status(400, "Invalid session or user.");
            }

            try {
                DBService.updateUsername(user_id, body);
            } catch (e) {
                return status(400, "User does not exist.");
            }
        },
        {
            body: TUpdateNameBody,
        }
    )
    .put(
        "/updateEmail",
        async ({ body, cookie: { session_token }, status }) => {
            const user_id = await DBService.getIDFromSession(
                session_token.value
            );
            if (user_id === null) {
                return status(400, "Invalid session or user.");
            }

            try {
                DBService.updateEmail(user_id, body);
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
        async ({ body, cookie: { session_token }, status }) => {
            const res = await AuthService.deleteUser({
                ...body,
                trusted: false,
            });
            if (!res.success) {
                return status(401);
            }

            session_token.remove();
        },
        { body: TDeleteUserBody }
    );
