import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.BACKEND_URL ||
  "http://127.0.0.1:5000";
const SESSION_COOKIE_NAME = "auth_session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, linkedInURL, photo } = body;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "firstName, lastName, and email are required" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    // Prepare profile data
    const profileData = {
      firstName,
      lastName,
      email,
      linkedInURL: linkedInURL || "",
      photo: photo || "",
    };

    // Call Flask backend to save profile
    try {
      const flaskResponse = await fetch(`${BACKEND_URL}/api/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sessionCookie && {
            Cookie: `${SESSION_COOKIE_NAME}=${sessionCookie}`,
          }),
        },
        body: JSON.stringify(profileData),
        cache: "no-store",
      });

      if (!flaskResponse.ok) {
        const errorText = await flaskResponse.text();
        console.error("Flask backend error:", errorText);
        return NextResponse.json(
          { error: "Failed to save profile to backend", details: errorText },
          { status: flaskResponse.status }
        );
      }

      const flaskData = await flaskResponse.json();
      return NextResponse.json({
        success: true,
        message: "Profile saved successfully",
        data: flaskData,
      });
    } catch (flaskError) {
      console.error("Error calling Flask backend:", flaskError);
      return NextResponse.json(
        {
          error: "Failed to connect to backend",
          details: flaskError instanceof Error ? flaskError.message : String(flaskError),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in profile save API:", error);
    return NextResponse.json(
      { error: "Failed to save profile" },
      { status: 500 }
    );
  }
}

