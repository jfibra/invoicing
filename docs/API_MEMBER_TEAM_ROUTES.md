# Member / Team / Login API Reference

This reference documents the relevant API routes in `routes/api.php` for:
- login/auth
- retrieving member information
- retrieving team and subteam information
- routes used by team leaders to view their team(s)

> Note: all routes are defined inside the `Route::middleware('frameguard')->group(...)` block. Some login/auth routes are further protected by `auth:sanctum`.

---

## 1. Login / Authentication Routes

| HTTP | Route | Controller | Description | Auth Required |
|------|-------|------------|-------------|---------------|
| POST | `/api/auth-login` | `App\Http\Controllers\API\UserController@authRequestLogin` | Login request. Authenticates user and returns auth token. | No |
| GET | `/api/authenticate` | `App\Http\Controllers\API\UserController@authResponse` | Returns authenticated user details if token is valid. | Yes (`auth:sanctum`) |
| POST | `/api/logout` | `App\Http\Controllers\API\UserController@authRequestLogout` | Logout by deleting Sanctum tokens. | Yes (`auth:sanctum`) |
| GET | `/api/logout` | `App\Http\Controllers\API\UserController@authRequestLogout` | Alternate logout route. | Yes (`auth:sanctum`) |

### Related account/user routes

| HTTP | Route | Controller | Description |
|------|-------|------------|-------------|
| POST | `/api/verify-user-account` | `App\Http\Controllers\API\UserController@verifyUserAccount` | Verify a user account; often used during login or user validation flows. |
| POST | `/api/save-basic-info` | `App\Http\Controllers\API\UserController@saveBasicInfo` | Save initial member basic info. |
| POST | `/api/save-additional-info` | `App\Http\Controllers\API\UserController@saveAdditionalInfo` | Save additional member info after registration. |
| POST | `/api/update-account` | `App\Http\Controllers\API\UserController@updateAccount` | Update member account information. |
| GET | `/api/user/{email}` | `App\Http\Controllers\API\UserController@getUser` | Get user data by email. |
| GET | `/api/agent/{email}` | `App\Http\Controllers\API\UserController@getAgent` | Get agent data by email. |

---

## 2. Member Information Routes

| HTTP | Route | Controller | Description |
|------|-------|------------|-------------|
| GET | `/api/members/with-teams` | `App\Http\Controllers\API\MemberSearchController@getMembersWithTeamsAndSubteams` | Returns members with their team and subteam relationships. Supports filters such as `name`, `team`, `subteam`, `status`. Pagination is built in. |
| GET | `/api/members/search` | `App\Http\Controllers\API\MemberSearchController@search` | Member search endpoint. Probably returns filtered member records. |
| GET | `/api/search/users` | `App\Http\Controllers\API\MemberSearchController@searchMembers` | Search members or users, likely used by the UI for searching user/member records. |
| GET | `/api/get-members-datatable` | `App\Http\Controllers\API\MemberSearchController@getMembersForDataTable` | Returns member data formatted for DataTables, including team and subteam names. |
| GET | `/api/member-with-user/{memberid}` | `App\Http\Controllers\API\MemberSearchController@getMemberWithUser` | Get a member by `memberid` along with associated user/account data. |
| GET | `/api/member-with-user-by-email/{email}` | `App\Http\Controllers\API\MemberSearchController@getMemberWithUserByEmail` | Get a member and user/account data by member email. |

### Useful filters for `/api/members/with-teams`

- `name` — filters by `completename` and concatenated first/middle/last name
- `team` — filters by team name
- `subteam` — filters by subteam name
- `status` — filters by member status

---

## 3. Team and Subteam Routes

| HTTP | Route | Controller | Description |
|------|-------|------------|-------------|
| GET | `/api/teams` | `App\Http\Controllers\API\SalesTeamController@teams` | Returns all teams ordered by `teamname`. |
| GET | `/api/teams` | `App\Http\Controllers\API\MemberSearchController@getTeams` | Returns all teams with `id` and `teamname`. |
| GET | `/api/teams/{teamId}/subteams` | `App\Http\Controllers\API\MemberSearchController@getSubteams` | Returns subteams for the specified team ID. |

> Note: There are two `/api/teams` routes defined in `routes/api.php`. The second definition (from `MemberSearchController`) likely overrides the first one due to route ordering.

### Team leader / leadership routes

| HTTP | Route | Controller | Description |
|------|-------|------------|-------------|
| GET | `/api/teams-with-team-leaders` | `App\Http\Controllers\API\SalesTeamController@teams_with_team_leaders` | Returns all teams together with active team leaders. |
| GET | `/api/team-with-leaders` | `App\Http\Controllers\API\SalesTeamController@get_team_with_team_leaders` | Returns a specific team and its leaders. Requires `teamname` query parameter. |

---

## 4. Team Leader / Team Member Views

These are the main routes usable for team-leader or team-member overview cases.

| HTTP | Route | Controller | Description |
|------|-------|------------|-------------|
| GET | `/api/members/with-teams` | `MemberSearchController@getMembersWithTeamsAndSubteams` | Primary route to fetch all members and their team/subteam membership. Best for team-member listings. |
| GET | `/api/teams/{teamId}/subteams` | `MemberSearchController@getSubteams` | Get subteam list for a given team. Useful when a leader selects a team and needs subteam breakdown. |
| GET | `/api/teams-with-team-leaders` | `SalesTeamController@teams_with_team_leaders` | Get teams along with their active leaders. Useful for leader-specific dashboards. |
| GET | `/api/team-with-leaders?teamname={name}` | `SalesTeamController@get_team_with_team_leaders` | Get a specific team's leaders. Useful for leader details by team. |

---

## 5. Additional Useful Member / Team Routes

| HTTP | Route | Controller | Description |
|------|-------|------------|-------------|
| GET | `/api/user/{email}` | `UserController@getUser` | Retrieve user details by email. Useful to look up member account info. |
| GET | `/api/agent/{email}` | `UserController@getAgent` | Retrieve agent details by email. |
| POST | `/api/save-basic-info` | `UserController@saveBasicInfo` | Save initial member profile data. |
| POST | `/api/save-additional-info` | `UserController@saveAdditionalInfo` | Save extra member profile fields. |
| POST | `/api/update-account` | `UserController@updateAccount` | Update account information for an existing member. |

---

## 6. Recommended Primary Endpoints for your use case

- `POST /api/auth-login` — login
- `GET /api/members/with-teams` — retrieve members with team/subteam assignment
- `GET /api/teams/{teamId}/subteams` — retrieve subteams by team
- `GET /api/member-with-user/{memberid}` — retrieve a member along with related account data
- `GET /api/teams-with-team-leaders` — retrieve teams with leaders
- `GET /api/team-with-leaders?teamname={teamname}` — retrieve a specific team's leaders

---

## 7. Important Notes

- The `members/with-teams` endpoint is the most useful route for getting members plus their team and subteam in one response.
- The file defines duplicate `/teams` routes. If both are needed, the duplicate route should be corrected in `routes/api.php` to avoid unexpected behavior.
- Authenticated routes under `auth:sanctum` must be called with a valid Sanctum token.

