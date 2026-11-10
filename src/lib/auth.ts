import { NextRequest } from "next/server";
import { commissionsDb } from "@/lib/db";
import { RowDataPacket } from "mysql2";

export interface AuthenticatedUser {
  id: number;
  memberId: number | null;
  name: string;
  email: string;
  roleId: number | null;
  roleName: string;
}

export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const sessionCookie = request.cookies.get("session_token")?.value;
    const authHeader = request.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
    const token = sessionCookie || bearerToken;

    if (!token) return null;

    const [rows] = await commissionsDb.query<RowDataPacket[]>(
      `SELECT user_id, member_id, name, email, role_id, role_name, expires_at 
       FROM user_sessions 
       WHERE session_token = ? AND (expires_at IS NULL OR expires_at > NOW()) 
       LIMIT 1`,
      [token]
    );

    if (rows.length === 0) return null;

    const session = rows[0];
    return {
      id: session.user_id,
      memberId: session.member_id,
      name: session.name,
      email: session.email,
      roleId: session.role_id,
      roleName: (session.role_name || "AGENT").toUpperCase(),
    };
  } catch (err) {
    console.error("Error authenticating request:", err);
    return null;
  }
}

export async function requireAuth(
  request: NextRequest,
  allowedRoles?: string[]
): Promise<{ user: AuthenticatedUser | null; errorResponse?: { error: string; status: number } }> {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return {
      user: null,
      errorResponse: { error: "Authentication required", status: 401 },
    };
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user.roleName.toUpperCase();
    const authorized = allowedRoles.map((r) => r.toUpperCase()).includes(userRole);
    if (!authorized) {
      return {
        user,
        errorResponse: {
          error: `Forbidden: role '${userRole}' is not authorized to perform this action`,
          status: 403,
        },
      };
    }
  }

  return { user };
}

