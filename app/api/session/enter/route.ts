import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { seatID, firstName, lastName, email, linkedInURL, photo } = body;

    // Validate required fields
    if (!seatID || !firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "seatID, firstName, lastName, and email are required" },
        { status: 400 }
      );
    }

    // Log the request for debugging (this is a mock API)
    console.log("=== MOCK SESSION ENTER API ===");
    console.log("Request body:", JSON.stringify(body, null, 2));
    console.log("=== END MOCK REQUEST ===");

    // Mock API response - in production, this would call the external API
    // For now, we just return success
    // TODO: Replace with actual external API call
    /*
    const externalApiUrl = process.env.EXTERNAL_SESSION_API_URL;
    const response = await fetch(`${externalApiUrl}/session/enter`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        seatID,
        firstName,
        lastName,
        email,
        linkedInURL,
        photo,
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to enter session" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    */

    // Mock successful response
    return NextResponse.json({
      success: true,
      message: "Session entered successfully",
      seatID,
    });
  } catch (error) {
    console.error("Error in session enter API:", error);
    return NextResponse.json(
      { error: "Failed to enter session" },
      { status: 500 }
    );
  }
}

