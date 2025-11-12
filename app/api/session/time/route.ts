import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const seat = searchParams.get("seat");

    // Log the request for debugging (this is a mock API)
    console.log("=== MOCK GET SESSION TIME API ===");
    console.log("Seat:", seat);
    console.log("=== END MOCK REQUEST ===");

    // Mock API response - in production, this would call the external API
    // For now, we return a mock startTime (20 seconds from now for testing)
    // TODO: Replace with actual external API call
    /*
    const externalApiUrl = process.env.EXTERNAL_SESSION_API_URL;
    const response = await fetch(`${externalApiUrl}/session/time?seat=${seat}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to get session time" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    */

    // Mock response - set startTime to static date: November 6, 2025 at 11:53:00 PM
    // In production, this would come from the external API
    // Note: JavaScript months are 0-indexed, so November is 10
    const startTime = new Date(2025, 10, 7, 9, 40, 0, 0); // November 7, 2025, 11:53:00 PM
    
    const startTimeISO = startTime.toISOString();

    return NextResponse.json({
      status: 200,
      body: {
        startTime: startTimeISO,
      },
    });
  } catch (error) {
    console.error("Error in get session time API:", error);
    return NextResponse.json(
      { error: "Failed to get session time" },
      { status: 500 }
    );
  }
}

