import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI || `${request.nextUrl.origin}/api/linkedin/callback`;
  
  if (!clientId) {
    console.error("LinkedIn Client ID not configured");
    return NextResponse.redirect(
      new URL("/Home?error=linkedin_not_configured", request.url)
    );
  }

  // Get token from URL parameter to pass through OAuth flow
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get("token");
  const forceLogin = searchParams.get("force") === "true"; // Check if we should force account selection

  // LinkedIn OAuth 2.0 authorization URL
  // For OpenID Connect, we need openid, profile, and email scopes
  // to access the userinfo endpoint
  const scope = "openid profile email";
  const state = token || "default"; // Use token as state to pass it through OAuth flow
  
  // Build the authorization URL
  let authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}&scope=${encodeURIComponent(scope)}`;
  
  // Add prompt=select_account to force account selection screen
  // This allows users to choose a different LinkedIn account
  if (forceLogin) {
    authUrl += `&prompt=select_account`;
  }

  return NextResponse.redirect(authUrl);
}

