import * as Stats from "../generated/stats-db-client";

["exit", "SIGINT", "SIGUSR1", "SIGUSR2", "uncaughtException"].forEach(e => {
    process.on(e, () => {
        StatDBService.$closeConnections();
    });
});

export class StatDBService {
    static #client: Stats.PrismaClient = new Stats.PrismaClient();

    public static $closeConnections() {
        StatDBService.#client.$disconnect();
    }
}

export * as Stats from "../generated/stats-db-client";
