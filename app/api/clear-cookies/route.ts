import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  
  // Clear LinkedIn-related cookies
  cookieStore.delete("linkedin_data");
  cookieStore.delete("linkedin_access_token");
  cookieStore.delete("temp_seat");
  cookieStore.delete("auth_session");
  
  // Only accept token - no legacy seat/room support
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get("token");
  
  // Redirect back to Home page
  const homeUrl = new URL("/Home", request.url);
  
  // Must have token
  if (token) {
    homeUrl.searchParams.set("token", token);
  } else {
    // No token provided - redirect to root with error
    const rootUrl = new URL("/", request.url);
    rootUrl.searchParams.set("error", "no_token");
    return NextResponse.redirect(rootUrl);
  }

  const response = NextResponse.redirect(homeUrl);
  response.cookies.set({
    name: "auth_session",
    value: "",
    maxAge: 0,
    path: "/",
  });
  
  return response;
}

