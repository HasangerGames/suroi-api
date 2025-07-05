import { Elysia } from "elysia";
import { TSessionCookie } from "../auth/auth-types";

export default new Elysia({
    prefix: "/admin",
})
    .guard({ cookie: TSessionCookie })
    .derive(() => {});
