import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI || `${request.nextUrl.origin}/api/linkedin/callback`;
  
  if (!clientId) {
    console.error("LinkedIn Client ID not configured");
    return NextResponse.redirect(
      new URL("/Home?error=linkedin_not_configured", request.url)
    );
  }

  // Get seat ID from cookies to pass through OAuth flow
  const cookieStore = await cookies();
  const seatId = cookieStore.get("seat")?.value;

  // LinkedIn OAuth 2.0 authorization URL
  // For OpenID Connect, we need openid, profile, and email scopes
  // to access the userinfo endpoint
  const scope = "openid profile email";
  const state = seatId || "default"; // Use seat ID as state to pass it through
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}&scope=${encodeURIComponent(scope)}`;

  return NextResponse.redirect(authUrl);
}

