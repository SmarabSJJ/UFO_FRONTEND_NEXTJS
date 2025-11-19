import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI || `${request.nextUrl.origin}/api/linkedin/callback`;
  
  if (!clientId) {
    console.error("LinkedIn Client ID not configured");
    return NextResponse.redirect(
      new URL("/profile?error=linkedin_not_configured", request.url)
    );
  }

  const forceLogin = request.nextUrl.searchParams.get("force") === "true";

  // LinkedIn OAuth 2.0 authorization URL
  // For OpenID Connect, we need openid, profile, and email scopes
  // Use "profile" as state to indicate this is for the profile page
  const scope = "openid profile email";
  const state = "profile"; // Use "profile" as state to identify profile page flow
  
  // Build the authorization URL
  let authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}&scope=${encodeURIComponent(scope)}`;
  
  // Add prompt=select_account to force account selection screen
  if (forceLogin) {
    authUrl += `&prompt=select_account`;
  }

  return NextResponse.redirect(authUrl);
}

