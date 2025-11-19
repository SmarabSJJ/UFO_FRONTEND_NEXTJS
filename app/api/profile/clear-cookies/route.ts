import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  
  // Clear LinkedIn-related cookies
  cookieStore.delete("linkedin_data");
  cookieStore.delete("linkedin_access_token");
  cookieStore.delete("temp_seat");
  cookieStore.delete("auth_session");
  
  // Redirect back to profile page
  const profileUrl = new URL("/profile", request.url);

  const response = NextResponse.redirect(profileUrl);
  response.cookies.set({
    name: "auth_session",
    value: "",
    maxAge: 0,
    path: "/",
  });
  
  return response;
}

