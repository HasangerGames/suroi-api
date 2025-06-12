import Elysia from "elysia";
import Config from "../config.json";
import api from "./api/api";
import type { ConfigSchema } from "./types/config";

const { hostname, port } = Config as ConfigSchema;

new Elysia({
    serve: { hostname }
}).use(api).listen(port);
