# suroi-api

## Setup

**Install deps:**
 - `bun install` and `pnpm i`

**Setup config:**
 - copy config.example.json to config.json and change as you wish

**Setup database:**
 - install postgresql
 - initialize postgresql: `su -l postgres -c "initdb --locale=C.UTF-8 --encoding=UTF8 -D '/var/lib/postgres/data'`
 - set up proper configuration and access in /var/lib/postgres/pg_hba.conf
    - suggested: local suroi_users_db all trust \n local suroi_stats_db all trust
 - enable and start postgresql `sudo systemctl enable postgresql && sudo systemctl start postgresql`
 - generate prisma schema: `pnpm generate`
 - push prisma schema to postgres database: `USERS_DB_URL=postgresql://postgres@localhost:5432/suroi_users_db STATS_DB_URL=postgresql://postgres@localhost:5432/suroi_stats_db pnpm migrate` (this is using the suggested database configurations by default)

**Start up development server:**
 - `pnpm dev` (make sure to set the USERS_DB_URL and STATS_DB_URL env variables as well here!)

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.2.15. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.