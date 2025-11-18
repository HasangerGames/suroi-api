import { t } from "elysia";
import Config from "../../config.json";
import { TLoginCompleteBody } from "./auth";
import type { ConfigSchema } from "./config";

const { maxNameLen } = Config as ConfigSchema;

export const TUpdateNameBody = t.String({
    maxLength: maxNameLen,
    error: "Name invalid or too long.",
});

export const TUpdateEmailBody = t.String({
    format: "email",
    error: "Invalid email.",
});

export const TDeleteUserBody = t.Omit(TLoginCompleteBody, ["trusted"]);

export const TAddFriendBody = t.Object({
    name: t.String(),
});
