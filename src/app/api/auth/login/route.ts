import { NextRequest, NextResponse } from "next/server";
import { leuterioDb, commissionsDb } from "@/lib/db";
import { RowDataPacket } from "mysql2";
import crypto from "crypto";

// Helper: Ensure user_login_logs table exists
async function ensureLoginLogsTable() {
  await commissionsDb.query(`
    CREATE TABLE IF NOT EXISTS user_login_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL,
      member_id INT NULL,
      email VARCHAR(255) NOT NULL,
      user_name VARCHAR(255) NULL,
      role_name VARCHAR(100) NULL,
      ip_address VARCHAR(100) NULL,
      user_agent TEXT NULL,
      status VARCHAR(50) NOT NULL DEFAULT "SUCCESS",
      failure_reason VARCHAR(255) NULL,
      login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_email (email),
      INDEX idx_status (status),
      INDEX idx_login_at (login_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

// Helper: Log User Login Event
async function recordLoginLog({
  user_id = null,
  member_id = null,
  email,
  user_name = null,
  role_name = null,
  ip_address = null,
  user_agent = null,
  status = "SUCCESS",
  failure_reason = null,
}: {
  user_id?: number | null;
  member_id?: number | null;
  email: string;
  user_name?: string | null;
  role_name?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  status?: string;
  failure_reason?: string | null;
}) {
  try {
    await ensureLoginLogsTable();
    await commissionsDb.query(`
      INSERT INTO user_login_logs (user_id, member_id, email, user_name, role_name, ip_address, user_agent, status, failure_reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      user_id,
      member_id,
      email,
      user_name,
      role_name,
      ip_address,
      user_agent,
      status,
      failure_reason,
    ]);
  } catch (e) {
    console.error("Failed to record login activity log:", e);
  }
}

export async function POST(request: NextRequest) {
  const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "127.0.0.1";
  const userAgent = request.headers.get("user-agent") || "Unknown Browser";

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const searchStr = email.trim();

    // 1. Precise User Lookup: First match target user record directly by email
    const userQuery = `
      SELECT 
        u.id as user_id, 
        u.name as user_name, 
        u.email as user_email, 
        u.password as user_password, 
        u.role_id, 
        r.role as role_name,
        m.id as member_id,
        m.memberid as member_code,
        m.status as member_status,
        st.teamname as team_name,
        stm.isleader as is_team_leader,
        sub.teamName as subteam_name,
        subm.isLeader as is_subteam_leader
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN members m ON (u.email = m.email AND m.email IS NOT NULL AND m.email != '') OR (u.email = m.emailad AND m.emailad IS NOT NULL AND m.emailad != '')
      LEFT JOIN sales_team_members stm ON stm.id = (
        SELECT id FROM sales_team_members WHERE memid = m.id AND activeTeam = 1 ORDER BY id DESC LIMIT 1
      )
      LEFT JOIN sales_team st ON stm.teamid = st.id AND st.status = 'active'
      LEFT JOIN salesteam_subteam_members subm ON subm.id = (
        SELECT id FROM salesteam_subteam_members WHERE memID = m.id AND (dateresigned IS NULL OR dateresigned = '0000-00-00' OR dateresigned >= CURDATE()) ORDER BY id DESC LIMIT 1
      )
      LEFT JOIN salesteam_subteam sub ON subm.subTeamID = sub.sid AND sub.status = 'active'
      WHERE u.email = ?
      LIMIT 1
    `;

    let [rows] = await leuterioDb.query<RowDataPacket[]>(userQuery, [searchStr]);

    // Fallback: If not found in users.email, search members table by email/emailad/memberid
    if (rows.length === 0) {
      const fallbackQuery = `
        SELECT 
          u.id as user_id, 
          u.name as user_name, 
          u.email as user_email, 
          u.password as user_password, 
          u.role_id, 
          r.role as role_name,
          m.id as member_id,
          m.memberid as member_code,
          m.status as member_status,
          st.teamname as team_name,
          stm.isleader as is_team_leader,
          sub.teamName as subteam_name,
          subm.isLeader as is_subteam_leader
        FROM members m
        LEFT JOIN users u ON (u.email = m.email AND m.email IS NOT NULL AND m.email != '') OR (u.email = m.emailad AND m.emailad IS NOT NULL AND m.emailad != '')
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN sales_team_members stm ON stm.id = (
          SELECT id FROM sales_team_members WHERE memid = m.id AND activeTeam = 1 ORDER BY id DESC LIMIT 1
        )
        LEFT JOIN sales_team st ON stm.teamid = st.id AND st.status = 'active'
        LEFT JOIN salesteam_subteam_members subm ON subm.id = (
          SELECT id FROM salesteam_subteam_members WHERE memID = m.id AND (dateresigned IS NULL OR dateresigned = '0000-00-00' OR dateresigned >= CURDATE()) ORDER BY id DESC LIMIT 1
        )
        LEFT JOIN salesteam_subteam sub ON subm.subTeamID = sub.sid AND sub.status = 'active'
        WHERE m.email = ? OR m.emailad = ? OR m.memberid = ?
        LIMIT 1
      `;
      [rows] = await leuterioDb.query<RowDataPacket[]>(fallbackQuery, [searchStr, searchStr, searchStr]);
    }

    if (rows.length === 0) {
      await recordLoginLog({
        email: searchStr,
        ip_address: ipAddress,
        user_agent: userAgent,
        status: "FAILED",
        failure_reason: "User email or credentials not found",
      });

      return NextResponse.json(
        { error: "Invalid email or credentials" },
        { status: 401 }
      );
    }

    const user = rows[0];

    // Allowed roles for dashboard access
    const allowedRoles = ["ADMIN", "SECRETARY", "AGENT", "SUPERVISOR", "UNIT MANAGER", "BROKER"];
    const userRole = (user.role_name || "").toUpperCase();

    if (user.role_id && !allowedRoles.includes(userRole)) {
      await recordLoginLog({
        user_id: user.user_id,
        member_id: user.member_id,
        email: user.user_email || searchStr,
        user_name: user.user_name,
        role_name: userRole,
        ip_address: ipAddress,
        user_agent: userAgent,
        status: "FAILED_ROLE",
        failure_reason: `Role '${userRole}' unauthorized`,
      });

      return NextResponse.json(
        { error: `Role '${userRole}' is not authorized to access this dashboard.` },
        { status: 403 }
      );
    }

    // 2. Generate Session Token
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days expiration

    // 3. WRITE Session to commissions_hub database
    const insertSessionSql = `
      INSERT INTO user_sessions (user_id, member_id, email, name, role_id, role_name, session_token, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await commissionsDb.query(insertSessionSql, [
      user.user_id || 0,
      user.member_id || null,
      user.user_email || searchStr,
      user.user_name || searchStr,
      user.role_id || null,
      userRole || "AGENT",
      sessionToken,
      expiresAt,
    ]);

    // 4. Record Successful Login in Activity Log
    await recordLoginLog({
      user_id: user.user_id,
      member_id: user.member_id,
      email: user.user_email || searchStr,
      user_name: user.user_name,
      role_name: userRole || "AGENT",
      ip_address: ipAddress,
      user_agent: userAgent,
      status: "SUCCESS",
    });

    // 5. Return user info and set HTTP-only cookie
    const responseData = {
      success: true,
      user: {
        id: user.user_id,
        memberId: user.member_id,
        memberCode: user.member_code,
        name: user.user_name,
        email: user.user_email || searchStr,
        roleId: user.role_id,
        roleName: userRole || "AGENT",
        teamName: user.team_name,
        isTeamLeader: Boolean(user.is_team_leader),
        subteamName: user.subteam_name,
        isSubteamLeader: Boolean(user.is_subteam_leader),
      },
      token: sessionToken,
    };

    const response = NextResponse.json(responseData);
    
    // Set secure session cookie
    response.cookies.set("auth_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Auth Login Error:", error);
    return NextResponse.json(
      { error: "Authentication failed", details: error.message },
      { status: 500 }
    );
  }
}

// GET Current Session User
export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("auth_session")?.value;

    if (!sessionToken) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Query session from commissions_hub DB
    const [sessions] = await commissionsDb.query<RowDataPacket[]>(
      "SELECT * FROM user_sessions WHERE session_token = ? AND (expires_at IS NULL OR expires_at > NOW()) LIMIT 1",
      [sessionToken]
    );

    if (sessions.length === 0) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const session = sessions[0];

    // Fetch user details from leuteriorealty DB
    const [rows] = await leuterioDb.query<RowDataPacket[]>(`
      SELECT 
        u.id as user_id, 
        u.name as user_name, 
        u.email as user_email, 
        u.role_id, 
        r.role as role_name,
        m.id as member_id,
        m.memberid as member_code,
        m.status as member_status,
        st.teamname as team_name,
        stm.isleader as is_team_leader,
        sub.teamName as subteam_name,
        subm.isLeader as is_subteam_leader
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN members m ON (u.email = m.email AND m.email IS NOT NULL AND m.email != '') OR (u.email = m.emailad AND m.emailad IS NOT NULL AND m.emailad != '')
      LEFT JOIN sales_team_members stm ON stm.id = (
        SELECT id FROM sales_team_members WHERE memid = m.id AND activeTeam = 1 ORDER BY id DESC LIMIT 1
      )
      LEFT JOIN sales_team st ON stm.teamid = st.id AND st.status = 'active'
      LEFT JOIN salesteam_subteam_members subm ON subm.id = (
        SELECT id FROM salesteam_subteam_members WHERE memID = m.id AND (dateresigned IS NULL OR dateresigned = '0000-00-00' OR dateresigned >= CURDATE()) ORDER BY id DESC LIMIT 1
      )
      LEFT JOIN salesteam_subteam sub ON subm.subTeamID = sub.sid AND sub.status = 'active'
      WHERE u.id = ?
      LIMIT 1
    `, [session.user_id]);

    if (rows.length === 0) {
      return NextResponse.json({
        authenticated: true,
        user: {
          id: session.user_id,
          memberId: session.member_id,
          memberCode: null,
          name: session.name,
          email: session.email,
          roleId: session.role_id,
          roleName: session.role_name || "AGENT",
          teamName: null,
          isTeamLeader: false,
          subteamName: null,
          isSubteamLeader: false,
        },
      });
    }

    const user = rows[0];

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.user_id,
        memberId: user.member_id,
        memberCode: user.member_code,
        name: user.user_name,
        email: user.user_email || session.email,
        roleId: user.role_id,
        roleName: user.role_name || session.role_name || "AGENT",
        teamName: user.team_name,
        isTeamLeader: Boolean(user.is_team_leader),
        subteamName: user.subteam_name,
        isSubteamLeader: Boolean(user.is_subteam_leader),
      },
    });
  } catch (error: any) {
    console.error("Session Verification Error:", error);
    return NextResponse.json({ authenticated: false, error: error.message }, { status: 500 });
  }
}
