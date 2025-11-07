import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // This contains the seat ID
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/Home?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/Home?error=no_code", request.url)
    );
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI || `${request.nextUrl.origin}/api/linkedin/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL("/Home?error=config_error", request.url)
    );
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
      return NextResponse.redirect(
        new URL(`/Home?error=token_exchange_failed&details=${encodeURIComponent(errorText)}`, request.url)
      );
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

    // Store seat ID if it was passed in state
    if (state && state !== "default") {
      cookieStore.set("seat", state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 24 hours
      });
    }

    // Redirect to fetch LinkedIn data and send to API
    return NextResponse.redirect(
      new URL("/api/linkedin/fetch-and-send", request.url)
    );
  } catch (error) {
    console.error("LinkedIn callback error:", error);
    return NextResponse.redirect(
      new URL("/Home?error=callback_error", request.url)
    );
  }
}

