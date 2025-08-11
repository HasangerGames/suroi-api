import { Elysia, t } from "elysia";
import { StatDBService } from "../../db/stats-db-service";

export default new Elysia({
    prefix: "/stats",
})
    .guard({
        query: t.Object({
            user_id: t.String(),
        }),
    })
    .resolve(({ query: { user_id } }) => {
        return { user_id };
    })
    .get("/basic_stats", async ({ user_id }) => {
        return await StatDBService.getBasicStats(user_id);
    })
    .get("/basic_matches", async ({ user_id }) => {
        return await StatDBService.getUserMatches(user_id);
    })
    .get("/full_matches", async ({ user_id }) => {
        return await StatDBService.getUserMatchPlayers(user_id);
    })
    .get("/kills", async ({ user_id }) => {
        return await StatDBService.getUserKills(user_id);
    })
    .get("/revives", async ({ user_id }) => {
        return await StatDBService.getUserRevives(user_id);
    })
    .get("/assists", async ({ user_id }) => {
        return await StatDBService.getUserAssists(user_id);
    })
    .get("/damage", async ({ user_id }) => {
        return await StatDBService.getUserDamage(user_id);
    });
