import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.BACKEND_URL ||
  "http://127.0.0.1:5000";

/**
 * API route to store token in cookie and redirect to Flask for LinkedIn auth
 * This ensures the token is stored server-side before redirecting
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token) {
      // No token provided - redirect back to Home with error
      const homeUrl = new URL("/Home", request.url);
      homeUrl.searchParams.set("error", "no_token");
      return NextResponse.redirect(homeUrl);
    }

    // Store token in cookie AND pass it to Flask via query parameter
    // This provides redundancy - cookie for same-domain, query param as backup
    const cookieStore = await cookies();
    cookieStore.set("pending_seat_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutes
      path: "/",
    });

    // Also pass token to Flask as query parameter (Flask will store it in state)
    // This ensures token is preserved even if cookie doesn't work
    const flaskAuthUrl = `${BACKEND_URL}/auth/linkedin/login?token=${encodeURIComponent(token)}`;

    console.log("auth-start - stored token in cookie and passing to Flask");
    console.log("auth-start - redirecting to Flask:", flaskAuthUrl);

    return NextResponse.redirect(flaskAuthUrl);
  } catch (error) {
    console.error("Error in auth-start route:", error);
    const homeUrl = new URL("/Home", request.url);
    homeUrl.searchParams.set("error", "auth_start_error");
    return NextResponse.redirect(homeUrl);
  }
}

