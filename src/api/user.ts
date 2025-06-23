import { Elysia, status, t } from "elysia";
import { AuthService } from "../auth/auth-service";
import Config from "../../config.json";
import type { ConfigSchema } from "../types/config";
import { DBService } from "../db/db-service";
import { Cookie, createCookieJar } from "elysia/cookies";

const { maxNameLen } = Config as ConfigSchema;

const SessionCookie = t.Cookie({
    session_token: t.String()
}, {
    error: "Session token is missing or invalid."
});

export default new Elysia({
    prefix: "/user", cookie: {
        secrets: process.env.COOKIE_SECRET,
        sign: ["session_token"],
        path: "/"
    }
})
    .derive(async ({ request, server }) => {
        const ip = server?.requestIP(request)?.address;
        if (!ip) {
            return status(400);
        }
        return { ip };
    })
    .guard({ cookie: SessionCookie })
    .post("/register", async ({ body: { username, email, w, sh, ih }, cookie: {session_token}, ip }) => {
        const auth = await AuthService.register(username, email, w, sh, ih, ip);
        if (!auth.success) {
            return status(400, auth.reason);
        }

        session_token.value = auth.token!;
        session_token.expires = auth.expires!;
    }, {
        body: t.Object({
            username: t.String(),
            email: t.String(),
            w: t.String(),
            sh: t.Array(t.String()),
            ih: t.Array(t.String())
        }),
    })
    .post("/login", async ({body: { username, trusted, w, sh, ih }, cookie: { session_token }}) => {
        const auth = await AuthService.authenticate(username, trusted, w, sh, ih);
        if (!auth.success) {
            return status(400, auth.reason);
        }

        session_token.value = auth.token!;
        session_token.expires = auth.expires!;
    }, {
        body: t.Object({
            username: t.String(),
            trusted: t.Boolean(),
            w: t.String(),
            sh: t.Array(t.String()),
            ih: t.Array(t.String())
        }),
    })
    // Authorize client and get IP.
    .resolve(async ({ cookie: { session_token }, ip, status }) => {
        const isAuthorized = await AuthService.sessionValid(session_token.value, ip);
        if (!isAuthorized) {
            return status(401);
        }

        return { ip };
    })
    .get("/logout", async ({ cookie: { session_token } }) => {
        AuthService.invalidateSession(session_token.value);
        session_token.remove();
    })
    .get("/renew_token", async ({ cookie: { session_token }, query: { trusted }, status }) => {
        const auth = await AuthService.renewToken(session_token.value, trusted);
        if (!auth.success) {
            return status(400, "Error renewing token.");
        }

        const { token, expires } = auth;
        session_token.value = token!;
        session_token.expires = expires!;
    }, {
        query: t.Object({ trusted: t.Optional(t.Boolean()) })
    })
    .put("/updateName", async ({ body, cookie: { session_token } }) => {
        const user_id = await DBService.getIDFromSession(session_token.value);
        if (user_id === null) {
            return status(400, "Invalid session or user.");
        }

        try {
            DBService.updateUsername(user_id, body);
        } catch (e) {
            return status(400, "User does not exist.");
        }
    }, {
        body: t.String({ maxLength: maxNameLen, error: "Name invalid or too long." })
    })
    .put("/updateEmail", async ({ body, cookie: { session_token } }) => {
        const user_id = await DBService.getIDFromSession(session_token.value);
        if (user_id === null) {
            return status(400, "Invalid session or user.");
        }

        try {
            DBService.updateEmail(user_id, body);
        } catch (e) {
            return status(400, "User does not exist.");
        }
    }, {
        body: t.String({ format: "email", error: "Invalid email." })
    });
