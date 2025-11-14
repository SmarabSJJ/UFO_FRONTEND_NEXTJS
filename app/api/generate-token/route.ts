import { NextRequest, NextResponse } from "next/server";
import { generateToken, isValidSeatFormat } from "@/lib/token-utils";

/**
 * Admin route to generate tokens for QR codes
 * Usage: /api/generate-token?seat=12&room=100
 * Returns: JSON with the token and full URL
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const seat = searchParams.get("seat");
    const room = searchParams.get("room") || "100";

    // Validate inputs
    if (!seat || seat.trim() === "") {
      return NextResponse.json(
        { error: "Seat parameter is required" },
        { status: 400 }
      );
    }

    const trimmedSeat = seat.trim();
    const trimmedRoom = room.trim();

    // Validate seat format
    if (!isValidSeatFormat(trimmedSeat)) {
      return NextResponse.json(
        { 
          error: "Invalid seat format",
          message: "Seat must start with 0 or 1, followed by digits (e.g., 01, 11, 012, 112)"
        },
        { status: 400 }
      );
    }

    // Generate token
    const token = generateToken(trimmedSeat, trimmedRoom);

    // Build the full URL
    const baseUrl = new URL(request.url);
    const rootUrl = `${baseUrl.protocol}//${baseUrl.host}`;
    const fullUrl = `${rootUrl}/?token=${token}`;

    return NextResponse.json({
      success: true,
      seat: trimmedSeat,
      room: trimmedRoom,
      token: token,
      url: fullUrl,
      qrCodeUrl: fullUrl, // Same as URL, but clearer name for QR code generation
    });
  } catch (error) {
    console.error("Error generating token:", error);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}

