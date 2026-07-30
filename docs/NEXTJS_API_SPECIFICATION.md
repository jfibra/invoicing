# Next.js Custom High-Performance Directory & Team API Specification

This document details the high-performance Next.js API routes created to accelerate data fetching from the `leuteriorealty` database (read-only) for team structures, subteams, leadership, and member rosters.

---

## 1. Get All Sales Teams (Paginated & Searchable)
- **Endpoint**: `GET /api/teams`
- **Query Parameters**:
  - `search` (optional): Search string by team name or team ID.
  - `page` (default `1`): Page number.
  - `limit` (default `10`): Items per page (`10`, `25`, `50`).
- **Response**:
  ```json
  {
    "success": true,
    "teams": [
      {
        "team_id": 92,
        "teamname": "Chin Dynasty",
        "team_status": "active",
        "date_established": "2023-01-22T16:00:00.000Z",
        "teamlogo": "https://.../chin-dynasty.jpg",
        "leader_member_id": 10743,
        "leader_name": "Mike Noel III And Grace Chin",
        "leader_email": "tomtomchin@yahoo.com",
        "leader_mobile": "0917...",
        "total_members": 48,
        "total_subteams": 9
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 86,
      "totalPages": 9
    }
  }
  ```

---

## 2. Get Single Team Details, Subteams, & Paginated Member Roster
- **Endpoint**: `GET /api/teams/[teamId]`
- **Query Parameters**:
  - `search` (optional): Search by member name, member code, or email.
  - `page` (default `1`): Roster page.
  - `limit` (default `10`): Roster items per page.
- **Response**:
  ```json
  {
    "team": {
      "id": 92,
      "teamname": "Chin Dynasty",
      "status": "active",
      "dateest": "2023-01-22T16:00:00.000Z",
      "teamlogo": "https://.../chin-dynasty.jpg"
    },
    "subteams": [
      {
        "subteam_id": 182,
        "subteam_name": "Home Providers",
        "subteam_status": "active",
        "leader_member_id": 16309,
        "leader_name": "Jane Doe",
        "leader_mobile": "0918...",
        "total_unit_members": 12
      }
    ],
    "members": [
      {
        "member_id": 10743,
        "member_code": "608173132",
        "completename": "Mike Noel III And Grace Chin",
        "email": "tomtomchin@yahoo.com",
        "mobile": "0917...",
        "city": "Cebu City",
        "member_status": "active",
        "is_team_leader": 1,
        "is_subteam_leader": 0,
        "subteam_name": "Chin Dynasty Main"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 48,
      "totalPages": 5
    }
  }
  ```

---

## 3. Get All Subteams List Across System (Paginated & Searchable)
- **Endpoint**: `GET /api/subteams`
- **Query Parameters**:
  - `search` (optional): Filter subteams by subteam name or parent team name.
  - `teamId` (optional): Filter subteams under a specific parent team ID.
  - `page` (default `1`): Page number.
  - `limit` (default `10`): Items per page.
- **Response**:
  ```json
  {
    "success": true,
    "subteams": [
      {
        "subteam_id": 182,
        "subteam_name": "Home Providers",
        "subteam_status": "active",
        "parent_team_id": 92,
        "parent_team_name": "Chin Dynasty",
        "leader_member_id": 16309,
        "leader_name": "Jane Doe",
        "total_members": 12
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 142,
      "totalPages": 15
    }
  }
  ```

---

## 4. Get Single Subteam Roster & Details
- **Endpoint**: `GET /api/subteams/[subteamId]`
- **Query Parameters**:
  - `search` (optional): Search members within this subteam.
  - `page` (default `1`): Page number.
  - `limit` (default `10`): Items per page.
- **Response**:
  ```json
  {
    "subteam": {
      "subteam_id": 182,
      "subteam_name": "Home Providers",
      "subteam_status": "active",
      "parent_team_id": 92,
      "parent_team_name": "Chin Dynasty",
      "leader_name": "Jane Doe"
    },
    "members": [
      {
        "member_id": 16309,
        "member_code": "41819201",
        "completename": "Jane Doe",
        "email": "jane@gmail.com",
        "mobile": "0918...",
        "is_subteam_leader": 1
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 12,
      "totalPages": 2
    }
  }
  ```

---

## 5. Combined Directory of Members with Team & Subteam Assignment
- **Endpoint**: `GET /api/users`
- **Query Parameters**:
  - `search`: Name, email, mobile, member code.
  - `status`: `all`, `active`, `inactive`.
  - `dateRange`: `today`, `yesterday`, `this_week`, `last_week`, `this_month`, `last_month`, `this_year`, `all`.
  - `page` & `limit`: Server-side pagination.
