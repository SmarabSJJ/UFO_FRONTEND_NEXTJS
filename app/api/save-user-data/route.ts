import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, linkedinUrl, seat } = body;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "First name, last name, and email are required" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    
    // Get existing LinkedIn data if available
    const existingDataCookie = cookieStore.get("linkedin_data")?.value;
    let existingData = {};
    
    if (existingDataCookie) {
      try {
        existingData = JSON.parse(existingDataCookie);
      } catch (e) {
        console.error("Error parsing existing LinkedIn data:", e);
      }
    }

    // Update the data with form values
    const updatedData = {
      ...existingData,
      firstName,
      lastName,
      email,
      lID: linkedinUrl || existingData.lID || "",
      seatId: seat || existingData.seatId || "",
    };

    // Save updated data to cookies
    cookieStore.set("linkedin_data", JSON.stringify(updatedData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return NextResponse.json({ success: true, data: updatedData });
  } catch (error) {
    console.error("Error saving user data:", error);
    return NextResponse.json(
      { error: "Failed to save user data" },
      { status: 500 }
    );
  }
}

