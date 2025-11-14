import { NextRequest, NextResponse } from "next/server";
import { validateToken } from "@/lib/token-utils";

/**
 * API route to decode a token and return seat/room
 * This is used by client components that need seat/room values
 * but only have the token in the URL
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token || token.trim() === "") {
      return NextResponse.json(
        { error: "Token parameter is required" },
        { status: 400 }
      );
    }

    // Decrypt token to get seat and room
    const tokenData = validateToken(token.trim());

    if (!tokenData) {
      return NextResponse.json(
        { error: "Invalid or tampered token" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      seat: tokenData.seat,
      room: tokenData.room,
    });
  } catch (error) {
    console.error("Error decoding token:", error);
    return NextResponse.json(
      { error: "Failed to decode token" },
      { status: 500 }
    );
  }
}

