import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * API route to retrieve the pending seat token from cookie
 * This is used by the auth callback page to get the token after Flask redirect
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("pending_seat_token")?.value;

    console.log("get-pending-token - cookie found:", !!token);
    console.log("get-pending-token - all cookies:", Array.from(cookieStore.getAll()).map(c => c.name));

    if (!token) {
      console.log("get-pending-token - no token found in cookie");
      return NextResponse.json({ token: null });
    }

    // Don't delete the cookie yet - keep it until we successfully redirect
    // The cookie will be cleared when user successfully reaches Home page

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Error getting pending token:", error);
    return NextResponse.json({ token: null });
  }
}

