/api
- /internal
    this is not public facing, for game servers to log data
    requires a private authentication token header, i believe albie worked on this part. i'll try to figure it out and document it
- /user
    this is public facing, for users to login and register etc
    - /login
        - POST /begin
            **REQUIRE** body payload for `username`
            **RETURN** json with the `salt` and `st`
        - POST /complete
            **REQUIRE** `username`, `w`, `sh`, `ih` as a payload
            **RETURN** `session_token` and `refresh_token` cookie if success
            this endpoint will only accept requests from those who have called /begin with `username` in the last 5? minutes
    - GET /logout
        **REQUIRE** `session_token` cookie
        **RETURN** 200 or error
    - GET /renew_token
        **REQUIRE** `session_token` and `refresh_token` cookie
        **RETURN** `session_token` and `refresh_token`
    - POST /register
        **REQUIRE** `username`, `email`, `w`, `sh`, `ih` as a payload
        **RETURN** `session_token` and `refresh_token` cookie if success
        this endpoint will only accept requests from those who have called /begin with `username` in the last 5? minutes
        - GET /saltshaker
            **RETURN** quick json with {salt: salt}
    - POST /update
        **REQUIRE** JSON fields that can be further outlined, updates various parts of the user, like email, name, password
    - POST /delete
        **REQUIRE** all login credentials: `username`, `w`, `sh`, `ih`
        **RETURN** 200 or error
- /info
    does not need any auth protection, publicly queryable stats
    - /stats
        - GET /\[username\]?filter=
            includes filtering to pull user stats
    - GET /servers

**token** and **refresh_token**:
- random base64 bytes, and prefix it with an expiry timestamp in epoch time
- Like 00000_A=======


## GET /api/user/logout

revokes the active session token.

## GET /api/user/renew_token
headers:
  session_token
query:
  trusted: boolean (optional, keeps current value if not provided)

get a new token (for silent renewal).

## POST /api/user/register
body:
  username: string
  email: string

  password: string
OR
  w: string
  sh: string[]
  ih: string[]

where the last three are from 616's authentication thing (I think there is a WASM for the frontend).

## POST /api/user/login
body:
  username: string
  trusted: boolean

  password: string
OR
  w: string
  sh: string[]
  ih: string[]

again, the last three are from the authentication library.
After a successful post to one of these, the server will send back a cookie with the session token. It will most likely be called session_token, but that's one of the details I haven't decided on yet.

For the two PUT paths below, and for other endpoints added after initial accounts (I have several in mind already), it will be necessary to have a valid session_token.


## PUT /api/user/updateName
headers:
  session_token
body: string (new name)


## PUT /api/user/updateEmail
headers:
  session_token
body: string (new email)


## DELETE /api/user
headers:
  session_token
body:
  username: string

  password: string
OR
  w: string
  sh: string[]
  ih: string[]


For request bodies all around I think we can standardize on JSON or a simple string for now. Keep in mind, this is just the basic start, and I can send the API for stats and stuff later when I have more time and when it is more decided (I am leaving for church in a couple minutes).
If there are changes to the API that you want, I'm happy to discuss and implement that but I think this is a good bare-bones minimum working start. 
Again, I have plans for the API for stats and achievements/unlocks/friends and all that, I just want to implement the most important stuff first.
And since the server can update all of those stats, the API can be simpler for updating them after/during games.
I've got to go for a while but will be back later. (I also have to drive back to Ohio after church because I was visiting home a state away).