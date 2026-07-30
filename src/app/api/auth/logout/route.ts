import { NextRequest, NextResponse } from "next/server";
import { commissionsDb } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("auth_session")?.value;

    if (sessionToken) {
      // Remove session token from commissions_hub DB
      await commissionsDb.query("DELETE FROM user_sessions WHERE session_token = ?", [sessionToken]);
    }

    const response = NextResponse.json({ success: true, message: "Logged out successfully" });
    
    // Clear HTTP-only cookie
    response.cookies.set("auth_session", "", {
      httpOnly: true,
      expires: new Date(0),
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Auth Logout Error:", error);
    return NextResponse.json({ error: "Logout failed", details: error.message }, { status: 500 });
  }
}
