import { Elysia } from "elysia";
import { TSessionCookie } from "../types/auth";

export default new Elysia({
    prefix: "/admin",
})
    .guard({ cookie: TSessionCookie })
    .derive(() => {});
