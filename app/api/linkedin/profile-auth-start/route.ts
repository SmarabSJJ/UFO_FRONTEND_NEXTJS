import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.BACKEND_URL ||
  "http://127.0.0.1:5000";

/**
 * API route to redirect to Flask for LinkedIn auth (profile page version)
 * Similar to auth-start but without requiring a token
 */
export async function GET(request: NextRequest) {
  try {
    // Redirect to Flask for LinkedIn auth (no token needed for profile page)
    const flaskAuthUrl = `${BACKEND_URL}/auth/linkedin/login?profile=true`;

    console.log("profile-auth-start - redirecting to Flask:", flaskAuthUrl);

    return NextResponse.redirect(flaskAuthUrl);
  } catch (error) {
    console.error("Error in profile-auth-start route:", error);
    const profileUrl = new URL("/profile", request.url);
    profileUrl.searchParams.set("error", "auth_start_error");
    return NextResponse.redirect(profileUrl);
  }
}

