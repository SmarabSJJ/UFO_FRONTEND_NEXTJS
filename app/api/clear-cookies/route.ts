import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  
  // Clear LinkedIn-related cookies
  cookieStore.delete("linkedin_data");
  cookieStore.delete("linkedin_access_token");
  cookieStore.delete("temp_seat");
  
  // Get the seat parameter if present to redirect back
  const searchParams = request.nextUrl.searchParams;
  const seat = searchParams.get("seat");
  
  // Redirect back to Home page
  const homeUrl = new URL("/Home", request.url);
  if (seat) {
    homeUrl.searchParams.set("seat", seat);
  }
  
  return NextResponse.redirect(homeUrl);
}

