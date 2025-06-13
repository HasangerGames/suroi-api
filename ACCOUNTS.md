# Stuff for planning out accounts

## Nodes (thingies)
 - Game Server (NA, EU, etc.)
 - Data Server - the one that handles moderation etc.
 - Primary Accounts DB - lives on Data Server, holds password hashes, user IDs, etc.
 - User Data DB - holds user statistics

## Databases (Postgres)

### Primary Accounts DB
| Username     | User ID      | Session token(s)    | Session nonce        | R_p           | Salt        |
|--------------|--------------|---------------------|----------------------|---------------|-------------|
| example      | Snowflake    | \[Expire\]\[CSRNG\] | Per auth algo spec.  | Root x nonce  | self-expl.  |
 - Only one table for just all the users
 - Algorithm hasn't been patented yet -- I can give a basic rundown on how it works

**users**
user_id       BIGINT PRIMARY KEY, #snowflake
username      TEXT UNIQUE NOT NULL, #a-z A-Z 0-9 \_-.
email         TEXT UNIQUE #xyz@abc.com
session_nonce TEXT, #b64 encoded binary data
nonce_root    TEXT, #b64 encoded binary data
salt          TEXT #b64 encoded binary data
 - May add phone numbers etc if wanted

**session_tokens**
user_id       BIGINT REFERENCES users(user_id),
session_token TEXT PRIMARY KEY, #\[Expire\]\[CSRNG\]
expires_at    TIMESTAMP,
created_at    TIMESTAMP DEFAULT NOW()

### User Data DB
 - Four tables: players, game_modes, team_modes, matches

**players**
user_id       BIGINT PRIMARY KEY, #same as from primary accounts db
username      TEXT UNIQUE
 - Potentially other info like display name, clan tags, etc

**game_modes**
mode_id       INTEGER PRIMARY KEY,
mode_name     TEXT UNIQUE

**team_modes**
team_mode_id  INTEGER PRIMARY KEY,
mode_name     TEXT UNIQUE

**matches**
match_id      BIGINT PRIMARY KEY
mode_id       INTEGER REFERENCES game_modes(mode_id),
team_mode_id  INTEGER REFERENCES team_modes(team_mode_id),
start_time    TIMESTAMP NOT NULL,
end_time      TIMESTAMP NOT NULL DEFAULT NOW()

**match_players**
match_id      BIGINT REFERENCES matches(match_id),
user_id       BIGINT REFERENCES players(user_id),
kills         INTEGER,
damage_dealt  INTEGER,
time_survived INTEGER,
revives       INTEGER,
win           BOOLEAN,
PRIMARY KEY   (match_id, user_id)