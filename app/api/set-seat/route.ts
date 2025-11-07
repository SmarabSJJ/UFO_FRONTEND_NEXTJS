import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const seat = searchParams.get("seat");

  if (seat) {
    const cookieStore = await cookies();
    cookieStore.set("temp_seat", seat, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      // No maxAge - session cookie only, cleared when browser closes
    });
  }

  // Redirect to Home page with clean URL
  return NextResponse.redirect(new URL("/Home", request.url));
}

