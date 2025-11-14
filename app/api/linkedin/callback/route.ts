import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // This contains the token
  const error = searchParams.get("error");

  // Get token from state to pass through error redirects
  const tokenParam = state && state !== "default" ? `&token=${encodeURIComponent(state)}` : "";

  if (error) {
    return NextResponse.redirect(
      new URL(`/Home?error=${encodeURIComponent(error)}${tokenParam}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(`/Home?error=no_code${tokenParam}`, request.url)
    );
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI || `${request.nextUrl.origin}/api/linkedin/callback`;

  if (!clientId || !clientSecret) {
    const errorUrl = new URL("/Home", request.url);
    errorUrl.searchParams.set("error", "config_error");
    if (state && state !== "default") {
      errorUrl.searchParams.set("token", state);
    }
    return NextResponse.redirect(errorUrl);
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange error:", errorText);
      console.error("Status:", tokenResponse.status);
      const errorUrl = new URL("/Home", request.url);
      errorUrl.searchParams.set("error", "token_exchange_failed");
      errorUrl.searchParams.set("details", errorText.substring(0, 200));
      if (state && state !== "default") {
        errorUrl.searchParams.set("token", state);
      }
      return NextResponse.redirect(errorUrl);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Store access token in cookie temporarily
    const cookieStore = await cookies();
    cookieStore.set("linkedin_access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60, // 1 hour
    });

    // Redirect to fetch LinkedIn data and send to API with token in URL
    const fetchUrl = new URL("/api/linkedin/fetch-and-send", request.url);
    if (state && state !== "default") {
      fetchUrl.searchParams.set("token", state);
    }
    return NextResponse.redirect(fetchUrl);
  } catch (error) {
    console.error("LinkedIn callback error:", error);
    const errorUrl = new URL("/Home", request.url);
    errorUrl.searchParams.set("error", "callback_error");
    if (state && state !== "default") {
      errorUrl.searchParams.set("token", state);
    }
    return NextResponse.redirect(errorUrl);
  }
}

